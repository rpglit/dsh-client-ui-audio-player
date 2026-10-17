import { AudioPlayerBody } from "./AudioPlayerBody.js";
import { AUDIO_EXTENSIONS } from "./audio.js";
import { readAudioFile } from "./audio-reader.js";
import { en, NS, ru, zh } from "./locales.js";
/** This renderer's implementation id, shared by the metadata and the keyed body slot. */
const BODY_ID = 'dsh-client-ui-audio-player';
/** Required services: the slot registry, copy, the preview registry, and the workspace byte reader. */
export const inject = ['slots', 'locale', 'documentPreviews', 'remote', 'remote.workspaceFiles'];
/**
 * The audio body's inject face: the windowed complete read bound to the
 * Remote, and the browser capability probe.
 * @param ctx - client root context carrying the Remote.
 * @returns the face the registration hands to the body.
 */
function audioFace(ctx) {
    const supportsType = (type) => {
        const answer = new Audio().canPlayType(type);
        return answer === 'probably' || answer === 'maybe';
    };
    return {
        readAll: (file, signal, onProgress) => readAudioFile(file, (sessionId, path, range, readSignal) => ctx.remote.workspaceFiles.readBytes(sessionId, path, { range }, readSignal), signal, onProgress),
        supportsType,
    };
}
/**
 * Client plugin body: register the dictionaries, the Russian language pack,
 * the preview metadata, and the keyed audio body, each as a reversible effect.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    const t = ctx.locale.bind(NS);
    const face = audioFace(ctx);
    ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'audio-player: dictionaries');
    // Russian may already be owned by another plugin (e.g. theme-pack, which
    // activates earlier because it has no remote-service dependency): the
    // unguarded addLanguage would throw "locale ru is already registered",
    // fail this entry, and hard-stop the strict web boot. Same no-owner
    // pattern as the theme-pack guard — first registrant wins.
    const noDisposal = () => { };
    ctx.effect(() => {
        try {
            return ctx.locale.addLanguage({ id: 'ru', label: 'Русский', fallback: 'en' });
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('already registered'))
                return noDisposal;
            throw error;
        }
    }, 'audio-player: Russian language');
    ctx.effect(() => ctx.locale.register(NS, 'ru', ru), 'audio-player: Russian dictionary');
    ctx.effect(() => ctx.documentPreviews.register({
        id: BODY_ID,
        extensions: [...AUDIO_EXTENSIONS],
        binaryExtensions: [...AUDIO_EXTENSIONS],
        title: () => t('title'),
        loading: 'renderer',
        wrap: false,
    }), 'audio-player: preview metadata');
    ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({
        name: 'sidebar.right.tab.document', key: BODY_ID, locale: NS, inject: () => face,
    }, AudioPlayerBody)), 'audio-player: body');
}
//# sourceMappingURL=index.js.map