/** Locale-owned copy for the audio preview renderer, one dictionary per language. */
/** This package's namespace, merged into the slot locale map by the client entry. */
export declare const NS = "audioPlayer";
/** Keys of this package's namespace, checked at registration. */
export type AudioPlayerKey = 'title' | 'loading' | 'unsupported';
/**
 * English dictionary. The shipped locales must keep identical key sets;
 * Host read failures use the preview owner's own failure lines.
 */
export declare const en: Record<AudioPlayerKey, string>;
/** Chinese dictionary. */
export declare const zh: Record<AudioPlayerKey, string>;
/** Russian dictionary, registered with the language pack this plugin contributes. */
export declare const ru: Record<AudioPlayerKey, string>;
//# sourceMappingURL=locales.d.ts.map