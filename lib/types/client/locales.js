/** Locale-owned copy for the audio preview renderer, one dictionary per language. */
/** This package's namespace, merged into the slot locale map by the client entry. */
export const NS = 'audioPlayer';
/**
 * English dictionary. The shipped locales must keep identical key sets;
 * Host read failures use the preview owner's own failure lines.
 */
export const en = {
    title: 'Audio',
    loading: 'Loading audio…',
    unsupported: 'This browser cannot play this audio format. Convert the file to MP3 and try again.',
};
/** Chinese dictionary. */
export const zh = {
    title: '音频',
    loading: '正在加载音频…',
    unsupported: '此浏览器无法播放该音频格式。请将文件转换为 MP3 后重试。',
};
/** Russian dictionary, registered with the language pack this plugin contributes. */
export const ru = {
    title: 'Аудио',
    loading: 'Загрузка аудио…',
    unsupported: 'Этот браузер не может воспроизвести данный формат аудио. Конвертируйте файл в MP3 и повторите.',
};
//# sourceMappingURL=locales.js.map