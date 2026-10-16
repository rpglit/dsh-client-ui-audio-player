/**
 * Browser audio capability facts for the recognized preview suffixes: the MIME
 * candidates one Blob may carry and the compact byte counts the body displays.
 */
/** Audio suffixes the preview renderer claims, without a leading dot. */
export declare const AUDIO_EXTENSIONS: readonly ["mp3", "wav", "ogg", "flac", "m4a", "aac", "opus"];
/**
 * MIME candidates per suffix, in preference order. A codec name may sit in a
 * container (an m4a is an MPEG-4 container, opus usually ships in Ogg), so the
 * capability probe walks the list instead of trusting one name.
 */
export declare const MIME_CANDIDATES: Readonly<Record<string, readonly string[]>>;
/**
 * Name the MIME candidates a filename's suffix may carry.
 * @param path - decoded workspace file path.
 * @returns the candidate list, or undefined for an unclaimed suffix.
 */
export declare function audioMimeCandidates(path: string): readonly string[] | undefined;
/**
 * Render a byte count in compact unit form in the page's language.
 * @param bytes - non-negative byte count.
 * @returns the formatted count.
 */
export declare function formatBytes(bytes: number): string;
//# sourceMappingURL=audio.d.ts.map