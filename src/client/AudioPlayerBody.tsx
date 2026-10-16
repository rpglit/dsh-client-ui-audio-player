/** Complete audio bytes presented as one native media element with a file caption. */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { parseFileAddress, pathPartsOf } from '@deepseek-ai/dsh-util-workspace-path'
import type { DocumentPreviewProps } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client'
import { audioMimeCandidates, formatBytes } from './audio.ts'
import type { AudioPlayerInjected, SessionFile } from './audio-reader.ts'
import css from './AudioPlayerBody.module.css'

/**
 * The session and path one `dsh-resource://file/…` address names.
 * @param address - a tab's file resource address.
 * @returns the Session-scoped file the read runs under, or undefined outside that scope.
 */
export function sessionFileOf(address: string): SessionFile | undefined {
  const parsed = parseFileAddress(address)
  if (parsed?.scope !== 'session') return undefined
  // The address is a string boundary: its id segment is the Session id it names.
  return { sessionId: parsed.sessionId as SessionId, path: parsed.path }
}

/** The one state this body renders while it works. */
type BodyState =
  | { readonly kind: 'loading'; readonly offset: number; readonly total: number | undefined }
  | { readonly kind: 'ready'; readonly url: string; readonly bytes: number | undefined }
  | { readonly kind: 'unsupported' }
  | { readonly kind: 'failed' }

/** Audio body inputs: the document owner share, the load face, and the dictionary. */
export type AudioPlayerBodyProps = DocumentPreviewProps & AudioPlayerInjected & PropsLocale<'audioPlayer'>

/**
 * Present a previewed audio file: the windowed read, the browser capability
 * check, the native player, and the one unsupported state the Host cannot see.
 * @param props - document content request, file address, load face, and locale.
 * @returns loading progress, the player with its caption, or the unsupported line.
 */
export function AudioPlayerBody(props: AudioPlayerBodyProps): ReactNode {
  const { tab } = props.useTabInfo()
  const { readAll, supportsType, resourceAddress, t } = props
  const request = props.content.kind === 'renderer' ? props.content : undefined
  const file = useMemo(() => sessionFileOf(resourceAddress), [resourceAddress])
  const revision = request?.revision
  const [state, setState] = useState<BodyState>({ kind: 'loading', offset: 0, total: undefined })

  useEffect(() => {
    if (request === undefined || file === undefined || tab.signal.aborted) return
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, tab.signal])
    let url: string | undefined
    setState({ kind: 'loading', offset: 0, total: undefined })
    void readAll(file, signal, (progress) => {
      if (!signal.aborted) setState({ kind: 'loading', offset: progress.offset, total: progress.total })
    }).then((result) => {
      if (signal.aborted) return
      if (!result.ok) {
        // Host read failures defer to the preview owner's own empty state.
        if (result.cancelled) return
        setState({ kind: 'failed' })
        request.failed()
        return
      }
      const mediaType = audioMimeCandidates(file.path)?.find(type => supportsType(type))
      if (mediaType === undefined) {
        setState({ kind: 'unsupported' })
        return
      }
      const objectUrl = URL.createObjectURL(new Blob([...result.parts], { type: mediaType }))
      url = objectUrl
      setState({ kind: 'ready', url: objectUrl, bytes: result.bytes })
      request.loaded(result.version)
    }, () => {
      if (!signal.aborted) {
        setState({ kind: 'failed' })
        request.failed()
      }
    })
    return () => {
      controller.abort()
      if (url !== undefined) URL.revokeObjectURL(url)
    }
  }, [revision, resourceAddress, file, tab.signal, readAll, supportsType])

  if (request === undefined || file === undefined || state.kind === 'failed') return null
  const { name } = pathPartsOf(file.path)
  if (state.kind === 'ready') {
    return (
      <div className={css.body} data-audio-player="ready">
        <p className={css.caption}>
          {name}
          {state.bytes !== undefined && <span className={css.size}> · {formatBytes(state.bytes)}</span>}
        </p>
        <audio
          className={css.audio}
          controls
          preload="metadata"
          src={state.url}
          onError={() => { setState({ kind: 'unsupported' }) }}
        />
      </div>
    )
  }
  if (state.kind === 'unsupported') {
    return (
      <div className={css.body} data-audio-player="unsupported">
        <p className={css.caption}>{name}</p>
        <p className={css.line} role="alert">{t('unsupported')}</p>
      </div>
    )
  }
  return (
    <div className={css.body} data-audio-player="loading">
      <p className={css.caption}>{name}</p>
      <p className={css.line}>
        {t('loading')}
        {state.total !== undefined && <span> · {formatBytes(state.offset)} / {formatBytes(state.total)}</span>}
      </p>
    </div>
  )
}
