/**
 * Browser half: register the audio renderer in the document preview.
 *
 * The renderer owns its read: windowed byte reads keep files above the
 * Host's complete-read cap playable, and the browser's capability probe names
 * the one unsupported state the Host cannot see. Host read failures defer to
 * the preview owner's own empty state. The plugin also contributes Russian as
 * a selectable language, with this package's dictionary translated.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-workspace-files/remote'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client'
import { AudioPlayerBody } from './AudioPlayerBody.tsx'
import { AUDIO_EXTENSIONS } from './audio.ts'
import { readAudioFile } from './audio-reader.ts'
import type { AudioPlayerInjected, SessionFile } from './audio-reader.ts'
import { en, NS, ru, zh } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Audio preview renderer copy. */
    audioPlayer: import('./locales.ts').AudioPlayerKey
  }
}

/** This renderer's implementation id, shared by the metadata and the keyed body slot. */
const BODY_ID = 'dsh-client-ui-audio-player'

/** Required services: the slot registry, copy, the preview registry, and the workspace byte reader. */
export const inject = ['slots', 'locale', 'documentPreviews', 'remote', 'remote.workspaceFiles']

/**
 * The audio body's inject face: the windowed complete read bound to the
 * Remote, and the browser capability probe.
 * @param ctx - client root context carrying the Remote.
 * @returns the face the registration hands to the body.
 */
function audioFace(ctx: ClientContext): AudioPlayerInjected {
  const supportsType = (type: string): boolean => {
    const answer = new Audio().canPlayType(type)
    return answer === 'probably' || answer === 'maybe'
  }
  return {
    readAll: (file: SessionFile, signal: AbortSignal, onProgress) => readAudioFile(
      file,
      (sessionId, path, range, readSignal) =>
        ctx.remote.workspaceFiles.readBytes(sessionId, path, { range }, readSignal),
      signal,
      onProgress,
    ),
    supportsType,
  }
}

/**
 * Client plugin body: register the dictionaries, the Russian language pack,
 * the preview metadata, and the keyed audio body, each as a reversible effect.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  const face = audioFace(ctx)
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'audio-player: dictionaries')
  ctx.effect(() => ctx.locale.addLanguage({ id: 'ru', label: 'Русский', fallback: 'en' }), 'audio-player: Russian language')
  ctx.effect(() => ctx.locale.register(NS, 'ru', ru), 'audio-player: Russian dictionary')
  ctx.effect(() => ctx.documentPreviews.register({
    id: BODY_ID,
    extensions: [...AUDIO_EXTENSIONS],
    binaryExtensions: [...AUDIO_EXTENSIONS],
    title: () => t('title'),
    loading: 'renderer',
    wrap: false,
  }), 'audio-player: preview metadata')
  ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({
    name: 'sidebar.right.tab.document', key: BODY_ID, locale: NS, inject: () => face,
  }, AudioPlayerBody)), 'audio-player: body')
}
