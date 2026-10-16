// @vitest-environment jsdom
/**
 * Browser-half lifecycle over the real slot and locale runtimes: the preview
 * metadata, the keyed body registration with fiber teardown (HMR safety), the
 * windowed read face, and the body's loading, player, and failure presentation.
 */
import { render, cleanup } from '@testing-library/react'
import type { RemoteResult } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceFileBytes } from '@deepseek-ai/dsh-api-workspace-files/types'
import type { DocumentContent } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client'
import { Context } from '@deepseek-ai/cordis'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { LocaleRuntime, type CommonKey } from '@deepseek-ai/dsh-client-locale/client'
import type { UseSidebarRightTabInfo } from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { InputActions } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { DocumentPreviewRegistry } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/document/registry.ts'
import { apply, inject } from '../src/client/index.ts'
import { apply as nodeApply } from '../src/index.ts'
import { AudioPlayerBody, sessionFileOf, type AudioPlayerBodyProps } from '../src/client/AudioPlayerBody.tsx'
import { readAudioFile, type AudioPlayerInjected, type AudioReadProgress, type AudioReadResult, type ReadByteWindow, type SessionFile } from '../src/client/audio-reader.ts'
import { AUDIO_EXTENSIONS, audioMimeCandidates, formatBytes } from '../src/client/audio.ts'
import { en, NS, ru, zh, type AudioPlayerKey } from '../src/client/locales.ts'

const BODY_ID = '@deepseek-ai/dsh-client-ui-audio-player'
const WINDOW = 2 * 1024 * 1024

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

/** One scripted byte window of a file cut at the requested range. */
function windowAt(total: number, offset: number, length: number, version: string): WorkspaceFileBytes<Uint8Array<ArrayBuffer>> {
  const end = Math.min(offset + length, total)
  return {
    absolutePath: '/workspace/clip.wav',
    version,
    bytes: total,
    offset,
    data: new Uint8Array(Math.max(0, end - offset)),
    eof: end >= total,
  }
}

/** A Remote readBytes face that cuts the total into the requested windows. */
function scriptedReadBytes(total: number, version: string): (
  sessionId: SessionId,
  path: string,
  options: { readonly range?: { readonly offset?: number; readonly length?: number } },
  signal: AbortSignal,
) => Promise<RemoteResult<WorkspaceFileBytes<Uint8Array<ArrayBuffer>>>> {
  return (_sessionId, _path, options, signal) => Promise.resolve(
    signal.aborted
      ? { ok: false, error: new RemoteError('gateway/cancelled', 'cancelled', {}) }
      : { ok: true, value: windowAt(total, options.range?.offset ?? 0, options.range?.length ?? total, version) },
  )
}

/** A windowed reader over one small file, for the reader unit cases. */
function tinyReadWindow(total: number, version: string): ReadByteWindow {
  return async (_sessionId, _path, range, signal) => Promise.resolve(
    signal.aborted
      ? { ok: false, error: new RemoteError('gateway/cancelled', 'cancelled', {}) }
      : { ok: true, value: windowAt(total, range.offset, range.length, version) },
  )
}

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  ctx.slots.register({
    name: 'root',
    children: {
      'sidebar.right.tab.document': { kind: 'keyed', scope: 'session' },
    },
  } as never, () => null)
  const previews = new DocumentPreviewRegistry()
  const readBytes = scriptedReadBytes(5 * WINDOW, 'v1')
  ctx.provide('documentPreviews', previews)
  ctx.provide('locale', new LocaleRuntime(ctx))
  ctx.provide('remote', { workspaceFiles: { readBytes } } as never)
  ctx.provide('remote.workspaceFiles', { readBytes } as never)
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return { ctx, fiber, previews, readBytes }
}

function benchFace(ctx: Context): AudioPlayerInjected {
  const entry = ctx.slots.entries('sidebar.right.tab.document').find(candidate => candidate.options.key === BODY_ID)
  const face = entry?.inject?.() as AudioPlayerInjected | undefined
  if (face === undefined) throw new Error('expected the injected audio face')
  return face
}

describe('audio-player browser half', () => {
  it('registers the preview metadata, the keyed body, and the dictionaries, and fiber teardown removes them', async () => {
    const { ctx, fiber, previews } = await bench()
    const definition = previews.getSnapshot().find(candidate => candidate.id === BODY_ID)
    expect(definition).toMatchObject({
      id: BODY_ID,
      extensions: [...AUDIO_EXTENSIONS],
      binaryExtensions: [...AUDIO_EXTENSIONS],
      loading: 'renderer',
      wrap: false,
    })
    expect(definition?.title()).toBe(en.title)
    const entry = ctx.slots.entries('sidebar.right.tab.document').find(candidate => candidate.options.key === BODY_ID)
    expect(entry?.component).toBe(AudioPlayerBody)
    const translate = ctx.locale.bind(NS)
    expect(translate('title')).toBe(en.title)
    ctx.locale.setLocale('zh')
    expect(translate('title')).toBe(zh.title)
    await fiber.dispose()
    expect(previews.getSnapshot().find(candidate => candidate.id === BODY_ID)).toBeUndefined()
    expect(ctx.slots.entries('sidebar.right.tab.document').find(candidate => candidate.options.key === BODY_ID)).toBeUndefined()
    expect(translate('title')).not.toBe(en.title)
  })

  it('contributes Russian as a selectable language with the package dictionary, released with the fiber', async () => {
    const { ctx, fiber } = await bench()
    const translate = ctx.locale.bind(NS)
    expect(ctx.locale.getSnapshot().locales.map(locale => locale.id)).toContain('ru')
    ctx.locale.setLocale('ru')
    expect(translate('title')).toBe(ru.title)
    expect(translate('unsupported')).toBe(ru.unsupported)
    await fiber.dispose()
    expect(ctx.locale.getSnapshot().locales.map(locale => locale.id)).not.toContain('ru')
  })

  it('keeps the shipped dictionaries key-identical', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(Object.keys(en).sort()).toEqual(Object.keys(ru).sort())
  })

  it('declares the services it binds', () => {
    expect(inject).toEqual(['slots', 'locale', 'documentPreviews', 'remote', 'remote.workspaceFiles'])
  })

  it('reads complete files in windows and reports progress per window', async () => {
    const { ctx, fiber } = await bench()
    try {
      const face = benchFace(ctx)
      const file: SessionFile = { sessionId: 's1' as SessionId, path: 'clip.wav' }
      const progress: AudioReadProgress[] = []
      const result = await face.readAll(file, new AbortController().signal, value => progress.push(value))
      expect(result).toMatchObject({ ok: true, version: 'v1', bytes: 5 * WINDOW })
      if (!result.ok) return
      expect(result.parts.reduce((sum, part) => sum + part.byteLength, 0)).toBe(5 * WINDOW)
      expect(progress.map(step => step.offset)).toEqual([WINDOW, 2 * WINDOW, 3 * WINDOW, 4 * WINDOW, 5 * WINDOW])
    } finally { await fiber.dispose() }
  })

  it('answers capability probes through the browser media element', async () => {
    vi.stubGlobal('Audio', class {
      canPlayType(type: string): string {
        return type === 'audio/mpeg' ? 'probably' : type === 'audio/flac' ? 'maybe' : ''
      }
    })
    const { ctx, fiber } = await bench()
    try {
      const face = benchFace(ctx)
      expect(face.supportsType('audio/mpeg')).toBe(true)
      expect(face.supportsType('audio/flac')).toBe(true)
      expect(face.supportsType('audio/opus-raw')).toBe(false)
    } finally { await fiber.dispose() }
  })
})

describe('windowed complete-file read', () => {
  const file: SessionFile = { sessionId: 's1' as SessionId, path: 'clip.wav' }

  it('stops at EOF and walks the offsets', async () => {
    const calls: { offset: number; length: number }[] = []
    const readWindow: ReadByteWindow = async (_sessionId, _path, range) => {
      calls.push(range)
      return { ok: true, value: windowAt(5 * WINDOW, range.offset, range.length, 'v2') }
    }
    const result = await readAudioFile(file, readWindow, new AbortController().signal, () => {})
    expect(result).toMatchObject({ ok: true, version: 'v2', bytes: 5 * WINDOW })
    expect(calls.map(call => call.offset)).toEqual([0, WINDOW, 2 * WINDOW, 3 * WINDOW, 4 * WINDOW])
  })

  it('delivers an empty file in one window', async () => {
    const readWindow: ReadByteWindow = async () => ({ ok: true, value: windowAt(0, 0, WINDOW, 'v1') })
    const result = await readAudioFile(file, readWindow, new AbortController().signal, () => {})
    expect(result).toMatchObject({ ok: true, parts: [], version: 'v1', bytes: 0 })
  })

  it('shrinks the window to the cap a too-large refusal reports', async () => {
    let calls = 0
    const cap = 1024 * 1024
    const readWindow: ReadByteWindow = async (_sessionId, _path, range) => {
      calls += 1
      if (range.length > cap) {
        return { ok: false, error: new RemoteError('workspace-file/too-large', 'above the cap', { path: 'clip.wav', limit: cap }) }
      }
      return { ok: true, value: windowAt(2 * cap, range.offset, range.length, 'v3') }
    }
    const result = await readAudioFile(file, readWindow, new AbortController().signal, () => {})
    expect(result).toMatchObject({ ok: true, version: 'v3', bytes: 2 * cap })
    expect(calls).toBe(3)
  })

  it('propagates a not-found refusal untouched', async () => {
    const readWindow: ReadByteWindow = async () => ({
      ok: false,
      error: new RemoteError('workspace-file/not-found', 'no entry', { path: 'clip.wav' }),
    })
    const result = await readAudioFile(file, readWindow, new AbortController().signal, () => {})
    expect(result).toMatchObject({ ok: false, cancelled: false, failure: { code: 'workspace-file/not-found' } })
  })

  it('answers cancellation before and during the read', async () => {
    const aborted = new AbortController()
    aborted.abort()
    const before = await readAudioFile(file, tinyReadWindow(10, 'v1'), aborted.signal, () => {})
    expect(before).toMatchObject({ ok: false, cancelled: true })
    const offsets: number[] = []
    const readWindow: ReadByteWindow = async (_sessionId, _path, range) => {
      offsets.push(range.offset)
      if (offsets.length >= 2) {
        return { ok: false, error: new RemoteError('gateway/cancelled', 'cancelled', {}) }
      }
      return { ok: true, value: windowAt(3 * WINDOW, range.offset, range.length, 'v1') }
    }
    const during = await readAudioFile(file, readWindow, new AbortController().signal, () => {})
    expect(during).toMatchObject({ ok: false, cancelled: true })
    expect(offsets).toEqual([0, WINDOW])
  })
})

describe('session file address translation', () => {
  it('names the session and path of a session address', () => {
    expect(sessionFileOf('dsh-resource://file/session/s1/nl2cover/output/clip.wav')).toEqual({
      sessionId: 's1' as SessionId, path: 'nl2cover/output/clip.wav',
    })
  })

  it('declines an absolute address', () => {
    expect(sessionFileOf('dsh-resource://file/absolute/workspace/clip.wav')).toBeUndefined()
  })
})

describe('audio capability facts', () => {
  it('maps every claimed suffix to candidates and none to a wrong one', () => {
    for (const extension of AUDIO_EXTENSIONS) {
      expect(audioMimeCandidates(`/w/track.${extension}`)).toBeTruthy()
    }
    expect(audioMimeCandidates('/w/track.txt')).toBeUndefined()
    expect(audioMimeCandidates('/w/no-extension')).toBeUndefined()
  })

  it('formats byte counts with the page unit form', () => {
    expect(formatBytes(512)).toMatch(/512 bytes?/)
    expect(formatBytes(30 * WINDOW)).toMatch(/M byte/)
  })
})

function bodyProps(overrides: {
  readonly content?: DocumentContent
  readonly resourceAddress?: string
  readonly readAll?: AudioPlayerInjected['readAll']
  readonly supportsType?: AudioPlayerInjected['supportsType']
  readonly tabSignal?: AbortSignal
} = {}) {
  const loaded = vi.fn()
  const failed = vi.fn()
  // The audio body reads no session-standard seat; these throw if one is touched.
  const unused = (): never => { throw new Error('session standard props are unused by the audio body') }
  const inputActions: InputActions = {
    captureInsertion: unused, insertText: unused, setDraft: unused, persistDraft: unused,
    addAttachments: unused, removeAttachment: unused, pruneAttachments: unused, submit: unused,
  }
  // One tab record per props object: the effect keys its lifetime on tab.signal,
  // so the stub must keep one identity across renders, like the bound hook does.
  const tab = { id: 'tab-1', signal: overrides.tabSignal ?? new AbortController().signal }
  const props: AudioPlayerBodyProps = {
    resourceAddress: overrides.resourceAddress ?? 'dsh-resource://file/session/s1/nl2cover/output/clip.wav',
    content: overrides.content ?? { kind: 'renderer', revision: 1, loaded, failed, reload: vi.fn() },
    wrap: false,
    scrollportRef: () => {},
    addResource: vi.fn(),
    setResources: vi.fn(),
    useSession: unused,
    sessionId: 's1' as SessionId,
    useProjection: unused,
    useAccess: unused,
    useChat: unused,
    useConversation: unused,
    useInput: unused,
    inputActions,
    useTrajectory: unused,
    usePanelInfo: unused,
    useRemoteAccess: unused,
    useSessions: unused,
    useSessionStatus: unused,
    useSessionRetainInfo: unused,
    useSessionAccess: unused,
    useResource: unused,
    useWorkspaces: unused,
    useWorkspaceAccess: unused,
    useTabInfo: (() => ({ tab })) as UseSidebarRightTabInfo,
    readAll: overrides.readAll ?? (async () => ({
      ok: true as const,
      parts: [new Uint8Array([1, 2, 3])],
      version: 'v1',
      bytes: 3,
    })),
    supportsType: overrides.supportsType ?? (() => true),
    t: (key: AudioPlayerKey | CommonKey) => Object.hasOwn(en, key) ? en[key as AudioPlayerKey] : key,
  }
  return { loaded, failed, props }
}

async function waitForAudio(container: ParentNode): Promise<HTMLAudioElement> {
  await vi.waitFor(() => {
    const audio = container.querySelector('audio')
    if (audio === null) throw new Error('still no audio element')
  })
  const audio = container.querySelector('audio')
  if (audio === null) throw new Error('audio element vanished')
  return audio
}

describe('audio body presentation', () => {
  it('reads the file, then shows the player with the caption and revokes on unmount', async () => {
    const created = vi.fn((_blob: Blob) => 'blob:audio-1')
    const revoked = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: created, revokeObjectURL: revoked })
    const { loaded, props } = bodyProps()
    const view = render(<AudioPlayerBody {...props} />)
    expect(view.container.textContent).toContain(en.loading)
    const audio = await waitForAudio(view.container)
    expect(audio.getAttribute('src')).toBe('blob:audio-1')
    expect(audio.getAttribute('preload')).toBe('metadata')
    expect(created).toHaveBeenCalledOnce()
    const blob = created.mock.calls[0]?.[0]
    expect(blob?.type).toBe('audio/wav')
    expect(loaded).toHaveBeenCalledWith('v1')
    expect(view.container.textContent).toContain('clip.wav')
    view.unmount()
    expect(revoked).toHaveBeenCalledWith('blob:audio-1')
  })

  it('shows loading progress before the last window settles', async () => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:audio-2'), revokeObjectURL: vi.fn() })
    let resolveRead: (value: AudioReadResult) => void = () => {}
    let reportProgress: (progress: AudioReadProgress) => void = () => {}
    const pending = new Promise<AudioReadResult>((resolve) => { resolveRead = resolve })
    const readAll = vi.fn((_file: SessionFile, _signal: AbortSignal, onProgress: (progress: AudioReadProgress) => void) => {
      reportProgress = onProgress
      return pending
    })
    const { props } = bodyProps({ readAll })
    const view = render(<AudioPlayerBody {...props} />)
    expect(view.container.textContent).toContain(en.loading)
    reportProgress({ offset: 2, total: 3 })
    await vi.waitFor(() => { expect(view.container.textContent).toContain(formatBytes(2)) })
    await vi.waitFor(() => { expect(view.container.textContent).toContain(formatBytes(3)) })
    resolveRead({ ok: true, parts: [], version: 'v1', bytes: 3 })
    await waitForAudio(view.container)
    expect(readAll).toHaveBeenCalledOnce()
  })

  it('names the unsupported state when no candidate MIME type plays', async () => {
    const { failed, props } = bodyProps({ supportsType: () => false })
    const view = render(<AudioPlayerBody {...props} />)
    await vi.waitFor(() => { expect(view.container.textContent).toContain(en.unsupported) })
    expect(view.container.querySelector('audio')).toBeNull()
    expect(failed).not.toHaveBeenCalled()
  })

  it('switches to the unsupported state on a media decode error', async () => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:audio-3'), revokeObjectURL: vi.fn() })
    const { props } = bodyProps()
    const view = render(<AudioPlayerBody {...props} />)
    const audio = await waitForAudio(view.container)
    audio.dispatchEvent(new Event('error'))
    await vi.waitFor(() => { expect(view.container.querySelector('audio')).toBeNull() })
    expect(view.container.textContent).toContain(en.unsupported)
  })

  it('defers a Host read failure to the owner and stays out of the way', async () => {
    const readAll = vi.fn(async (): Promise<AudioReadResult> => ({
      ok: false,
      cancelled: false,
      failure: new RemoteError('workspace-file/not-found', 'no entry', { path: 'clip.wav' }),
    }))
    const { failed, props } = bodyProps({ readAll })
    const view = render(<AudioPlayerBody {...props} />)
    await vi.waitFor(() => { expect(failed).toHaveBeenCalledOnce() })
    expect(view.container.textContent).toBe('')
  })

  it('starts nothing while the tab lifetime is already over', () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:audio-4'), revokeObjectURL: vi.fn() })
    const readAll = vi.fn(async (): Promise<AudioReadResult> => { throw new Error('read must not start') })
    const { props } = bodyProps({ readAll, tabSignal: controller.signal })
    const view = render(<AudioPlayerBody {...props} />)
    expect(readAll).not.toHaveBeenCalled()
    expect(view.container.textContent).toContain(en.loading)
  })

  it('ignores progress and results reported after the tab lifetime ends', async () => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:audio-5'), revokeObjectURL: vi.fn() })
    const controller = new AbortController()
    const readAll = vi.fn(
      (_file: SessionFile, _signal: AbortSignal, onProgress: (progress: AudioReadProgress) => void): Promise<AudioReadResult> => {
        onProgress({ offset: 1, total: 9 })
        controller.abort()
        onProgress({ offset: 2, total: 9 })
        return Promise.resolve({ ok: true, parts: [], version: 'v1', bytes: 9 })
      },
    )
    const { loaded, props } = bodyProps({ readAll, tabSignal: controller.signal })
    const view = render(<AudioPlayerBody {...props} />)
    await vi.waitFor(() => { expect(readAll).toHaveBeenCalledOnce() })
    expect(loaded).not.toHaveBeenCalled()
    expect(view.container.textContent).toContain(`${formatBytes(1)} /`)
    expect(view.container.textContent).not.toContain(`${formatBytes(2)} /`)
  })

  it('renders nothing for a non-renderer content kind or an absolute address', () => {
    const bytes = bodyProps({ content: { kind: 'bytes', data: new Uint8Array([1]) } })
    const absolute = bodyProps({ resourceAddress: 'dsh-resource://file/absolute/workspace/clip.wav' })
    expect(render(<AudioPlayerBody {...bytes.props} />).container.textContent).toBe('')
    expect(render(<AudioPlayerBody {...absolute.props} />).container.textContent).toBe('')
  })
})

describe('ui-audio-player node half', () => {
  it('the node apply is an inert loader seat', () => {
    expect(() => { nodeApply() }).not.toThrow()
  })
})
