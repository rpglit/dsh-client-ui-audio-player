/**
 * Browser half: register the audio renderer in the document preview.
 *
 * The renderer owns its read: windowed byte reads keep files above the
 * Host's complete-read cap playable, and the browser's capability probe names
 * the one unsupported state the Host cannot see. Host read failures defer to
 * the preview owner's own empty state. The plugin also contributes Russian as
 * a selectable language, with this package's dictionary translated.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Audio preview renderer copy. */
        audioPlayer: import('./locales.ts').AudioPlayerKey;
    }
}
/** Required services: the slot registry, copy, the preview registry, and the workspace byte reader. */
export declare const inject: string[];
/**
 * Client plugin body: register the dictionaries, the Russian language pack,
 * the preview metadata, and the keyed audio body, each as a reversible effect.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map