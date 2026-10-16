/** First window size: the Host's default `maxBytes`, refused only above the configured cap. */
const WINDOW_BYTES = 2 * 1024 * 1024;
/**
 * Read a complete file in windows until EOF.
 * @param file - Session and path.
 * @param readWindow - bound byte-window reader.
 * @param signal - request lifetime; the read stops at the next window boundary.
 * @param onProgress - counter reporter, called after each settled window.
 * @returns the assembled windows with the last window's version, the failure
 * the Host declares, or a cancellation marker for an aborted lifetime.
 */
export async function readAudioFile(file, readWindow, signal, onProgress) {
    let offset = 0;
    let length = WINDOW_BYTES;
    const parts = [];
    let total;
    let version;
    for (;;) {
        if (signal.aborted)
            return { ok: false, cancelled: true };
        const result = await readWindow(file.sessionId, file.path, { offset, length }, signal);
        if (!result.ok) {
            if (result.error.code === 'gateway/cancelled')
                return { ok: false, cancelled: true };
            // A window above the Host's configured cap is refused with the cap in details.
            if (result.error.code === 'workspace-file/too-large' && result.error.details.limit < length) {
                length = result.error.details.limit;
                continue;
            }
            return { ok: false, cancelled: false, failure: result.error };
        }
        const window = result.value;
        total ??= window.bytes;
        version = window.version;
        if (window.data.byteLength > 0)
            parts.push(window.data);
        offset += window.data.byteLength;
        onProgress({ offset, total });
        // EOF, or an empty non-final window from a file that shrank mid-read.
        if (window.eof || window.data.byteLength === 0) {
            return { ok: true, parts, version, bytes: total };
        }
    }
}
//# sourceMappingURL=audio-reader.js.map