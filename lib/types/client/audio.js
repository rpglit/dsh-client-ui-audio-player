/**
 * Browser audio capability facts for the recognized preview suffixes: the MIME
 * candidates one Blob may carry and the compact byte counts the body displays.
 */
/** Audio suffixes the preview renderer claims, without a leading dot. */
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus'];
/**
 * MIME candidates per suffix, in preference order. A codec name may sit in a
 * container (an m4a is an MPEG-4 container, opus usually ships in Ogg), so the
 * capability probe walks the list instead of trusting one name.
 */
export const MIME_CANDIDATES = {
    aac: ['audio/aac', 'audio/x-aac'],
    flac: ['audio/flac'],
    m4a: ['audio/mp4', 'audio/aac', 'audio/mpeg'],
    mp3: ['audio/mpeg'],
    ogg: ['audio/ogg; codecs=opus', 'audio/ogg; codecs=vorbis', 'audio/ogg'],
    opus: ['audio/ogg; codecs=opus', 'audio/ogg'],
    wav: ['audio/wav', 'audio/x-wav', 'audio/wave'],
};
/**
 * Name the MIME candidates a filename's suffix may carry.
 * @param path - decoded workspace file path.
 * @returns the candidate list, or undefined for an unclaimed suffix.
 */
export function audioMimeCandidates(path) {
    const normalized = path.replaceAll('\\', '/');
    const name = normalized.slice(normalized.lastIndexOf('/') + 1).toLowerCase();
    const extension = name.slice(name.lastIndexOf('.') + 1);
    return MIME_CANDIDATES[extension];
}
/**
 * Render a byte count in compact unit form in the page's language.
 * @param bytes - non-negative byte count.
 * @returns the formatted count.
 */
export function formatBytes(bytes) {
    return new Intl.NumberFormat(undefined, { notation: 'compact', style: 'unit', unit: 'byte' }).format(bytes);
}
//# sourceMappingURL=audio.js.map