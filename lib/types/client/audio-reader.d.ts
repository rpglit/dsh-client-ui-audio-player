/**
 * The windowed complete-file read the audio body performs over the Host's
 * byte endpoint: fixed 2 MiB windows that stop at EOF and shrink to the cap
 * the Host reports, so a file above the complete-read cap still plays.
 */
import type { RemoteFailure, RemoteResult } from '@deepseek-ai/dsh-api-remotes/client';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { WorkspaceFileBytes } from '@deepseek-ai/dsh-api-workspace-files/types';
/** The file one windowed read addresses: its Session and the Host path. */
export interface SessionFile {
    /** The Session whose workspace resolves relative paths. */
    readonly sessionId: SessionId;
    /** The path the Host receives, absolute or relative to the Session's workspace. */
    readonly path: string;
}
/** One byte window of the Host endpoint, addressed by an explicit range. */
export type ReadByteWindow = (sessionId: SessionId, path: string, range: {
    readonly offset: number;
    readonly length: number;
}, signal: AbortSignal) => Promise<RemoteResult<WorkspaceFileBytes<Uint8Array<ArrayBuffer>>>>;
/** Byte counters reported after each settled window. */
export interface AudioReadProgress {
    /** Bytes accumulated so far. */
    readonly offset: number;
    /** Complete file size, once the first window's stat reports it. */
    readonly total: number | undefined;
}
/** The audio body load face: the windowed complete read and the browser capability probe. */
export type AudioPlayerInjected = {
    /**
     * Read the complete file in windows.
     * @param file - Session and path decoded from the tab address.
     * @param signal - request lifetime, cancelled on replacement, unmount, or tab closure.
     * @param onProgress - byte counters after each settled window.
     * @returns the assembled windows, the failure the Host declares, or a cancellation.
     */
    readonly readAll: (file: SessionFile, signal: AbortSignal, onProgress: (progress: AudioReadProgress) => void) => Promise<AudioReadResult>;
    /**
     * Whether the browser's media element plays one MIME type.
     * @param type - candidate media type.
     * @returns true on a maybe or probably answer.
     */
    readonly supportsType: (type: string) => boolean;
};
/** The windowed read's outcome: assembled windows, a settled failure, or a cancellation. */
export type AudioReadResult = {
    readonly ok: true;
    /** The settled windows in order; borrowed read-only, ready for one Blob. */
    readonly parts: readonly Uint8Array<ArrayBuffer>[];
    /** The file version the last window's stat reported. */
    readonly version: string;
    /** Complete file size from the first window's stat, when the backend reports it. */
    readonly bytes: number | undefined;
} | {
    readonly ok: false;
    readonly cancelled: true;
} | {
    readonly ok: false;
    readonly cancelled: false;
    readonly failure: RemoteFailure;
};
/**
 * Read a complete file in windows until EOF.
 * @param file - Session and path.
 * @param readWindow - bound byte-window reader.
 * @param signal - request lifetime; the read stops at the next window boundary.
 * @param onProgress - counter reporter, called after each settled window.
 * @returns the assembled windows with the last window's version, the failure
 * the Host declares, or a cancellation marker for an aborted lifetime.
 */
export declare function readAudioFile(file: SessionFile, readWindow: ReadByteWindow, signal: AbortSignal, onProgress: (progress: AudioReadProgress) => void): Promise<AudioReadResult>;
//# sourceMappingURL=audio-reader.d.ts.map