import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/** Complete audio bytes presented as one native media element with a file caption. */
import { useEffect, useMemo, useState } from 'react';
import { parseFileAddress, pathPartsOf } from '@deepseek-ai/dsh-util-workspace-path';
import { audioMimeCandidates, formatBytes } from "./audio.js";
import css from './AudioPlayerBody.module.css';
/**
 * The session and path one `dsh-resource://file/…` address names.
 * @param address - a tab's file resource address.
 * @returns the Session-scoped file the read runs under, or undefined outside that scope.
 */
export function sessionFileOf(address) {
    const parsed = parseFileAddress(address);
    if (parsed?.scope !== 'session')
        return undefined;
    // The address is a string boundary: its id segment is the Session id it names.
    return { sessionId: parsed.sessionId, path: parsed.path };
}
/**
 * Present a previewed audio file: the windowed read, the browser capability
 * check, the native player, and the one unsupported state the Host cannot see.
 * @param props - document content request, file address, load face, and locale.
 * @returns loading progress, the player with its caption, or the unsupported line.
 */
export function AudioPlayerBody(props) {
    const { tab } = props.useTabInfo();
    const { readAll, supportsType, resourceAddress, t } = props;
    const request = props.content.kind === 'renderer' ? props.content : undefined;
    const file = useMemo(() => sessionFileOf(resourceAddress), [resourceAddress]);
    const revision = request?.revision;
    const [state, setState] = useState({ kind: 'loading', offset: 0, total: undefined });
    useEffect(() => {
        if (request === undefined || file === undefined || tab.signal.aborted)
            return;
        const controller = new AbortController();
        const signal = AbortSignal.any([controller.signal, tab.signal]);
        let url;
        setState({ kind: 'loading', offset: 0, total: undefined });
        void readAll(file, signal, (progress) => {
            if (!signal.aborted)
                setState({ kind: 'loading', offset: progress.offset, total: progress.total });
        }).then((result) => {
            if (signal.aborted)
                return;
            if (!result.ok) {
                // Host read failures defer to the preview owner's own empty state.
                if (result.cancelled)
                    return;
                setState({ kind: 'failed' });
                request.failed();
                return;
            }
            const mediaType = audioMimeCandidates(file.path)?.find(type => supportsType(type));
            if (mediaType === undefined) {
                setState({ kind: 'unsupported' });
                return;
            }
            const objectUrl = URL.createObjectURL(new Blob([...result.parts], { type: mediaType }));
            url = objectUrl;
            setState({ kind: 'ready', url: objectUrl, bytes: result.bytes });
            request.loaded(result.version);
        }, () => {
            if (!signal.aborted) {
                setState({ kind: 'failed' });
                request.failed();
            }
        });
        return () => {
            controller.abort();
            if (url !== undefined)
                URL.revokeObjectURL(url);
        };
    }, [revision, resourceAddress, file, tab.signal, readAll, supportsType]);
    if (request === undefined || file === undefined || state.kind === 'failed')
        return null;
    const { name } = pathPartsOf(file.path);
    if (state.kind === 'ready') {
        return (_jsxs("div", { className: css.body, "data-audio-player": "ready", children: [_jsxs("p", { className: css.caption, children: [name, state.bytes !== undefined && _jsxs("span", { className: css.size, children: [" \u00B7 ", formatBytes(state.bytes)] })] }), _jsx("audio", { className: css.audio, controls: true, preload: "metadata", src: state.url, onError: () => { setState({ kind: 'unsupported' }); } })] }));
    }
    if (state.kind === 'unsupported') {
        return (_jsxs("div", { className: css.body, "data-audio-player": "unsupported", children: [_jsx("p", { className: css.caption, children: name }), _jsx("p", { className: css.line, role: "alert", children: t('unsupported') })] }));
    }
    return (_jsxs("div", { className: css.body, "data-audio-player": "loading", children: [_jsx("p", { className: css.caption, children: name }), _jsxs("p", { className: css.line, children: [t('loading'), state.total !== undefined && _jsxs("span", { children: [" \u00B7 ", formatBytes(state.offset), " / ", formatBytes(state.total)] })] })] }));
}
//# sourceMappingURL=AudioPlayerBody.js.map