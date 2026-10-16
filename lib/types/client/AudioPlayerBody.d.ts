/** Complete audio bytes presented as one native media element with a file caption. */
import { type ReactNode } from 'react';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { DocumentPreviewProps } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client';
import type { AudioPlayerInjected, SessionFile } from './audio-reader.ts';
/**
 * The session and path one `dsh-resource://file/…` address names.
 * @param address - a tab's file resource address.
 * @returns the Session-scoped file the read runs under, or undefined outside that scope.
 */
export declare function sessionFileOf(address: string): SessionFile | undefined;
/** Audio body inputs: the document owner share, the load face, and the dictionary. */
export type AudioPlayerBodyProps = DocumentPreviewProps & AudioPlayerInjected & PropsLocale<'audioPlayer'>;
/**
 * Present a previewed audio file: the windowed read, the browser capability
 * check, the native player, and the one unsupported state the Host cannot see.
 * @param props - document content request, file address, load face, and locale.
 * @returns loading progress, the player with its caption, or the unsupported line.
 */
export declare function AudioPlayerBody(props: AudioPlayerBodyProps): ReactNode;
//# sourceMappingURL=AudioPlayerBody.d.ts.map