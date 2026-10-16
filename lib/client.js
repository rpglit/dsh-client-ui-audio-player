window.__ModuleLoader__.load({
	id: "dsh-client-ui-audio-player",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region node_modules/.pnpm/@deepseek-ai+dsh-util-workspace-path@0.2.1-alpha.4_@deepseek-ai+cordis@4.0.5-alpha.2/node_modules/@deepseek-ai/dsh-util-workspace-path/lib/index.js
		/**
		* The `dsh-resource://file/…` address grammar: how a file is named across the
		* Sidebar and the resource model, built and parsed without touching a
		* filesystem.
		* @module
		*/
		/** The scheme and type every file address opens with. */
		const FILE_ADDRESS_PREFIX = "dsh-resource://file/";
		/** Whether a decoded first path segment is a Windows drive (`C:`). */
		function isDriveSegment(segment) {
			return segment !== void 0 && /^[A-Za-z]:$/.test(segment);
		}
		/**
		* Read a file address back into its parts without resolving `.` or `..`.
		* Query and fragment suffixes are ignored; encoded path segments are decoded.
		* @param address - a candidate address.
		* @returns the parts, or `undefined` when the string is not a `dsh-resource://file/` URI in a known scope with a path, or a segment is not validly encoded.
		*/
		function parseFileAddress(address) {
			try {
				if (!address.startsWith(FILE_ADDRESS_PREFIX)) return void 0;
				const end = address.search(/[?#]/);
				const [scope, ...rest] = address.slice(20, end === -1 ? void 0 : end).split("/");
				if (scope === "session") {
					const [id, ...segments] = rest;
					if (id === void 0 || id === "" || segments.length === 0) return void 0;
					return {
						scope,
						sessionId: decodeURIComponent(id),
						path: segments.map(decodeURIComponent).join("/")
					};
				}
				if (scope === "absolute") {
					const unc = rest[0] === "" && rest.length > 1;
					const segments = (unc ? rest.slice(1) : rest).map(decodeURIComponent);
					if (segments.length === 0 || segments[0] === "") return void 0;
					if (unc) return {
						scope,
						path: `//${segments.join("/")}`
					};
					return {
						scope,
						path: isDriveSegment(segments[0]) ? segments.join("/") : `/${segments.join("/")}`
					};
				}
				return;
			} catch {
				return;
			}
		}
		/**
		* Split a path for display: the directories through their last separator, and
		* the final segment after it. Both `/` and `\` separate, so a Windows path
		* splits where its own segments end; trailing separators are dropped first, so
		* a directory path names its own last segment. A path with no separator, or a
		* separator-only path, is all name.
		* @param path - file or directory path using POSIX or Windows separators.
		* @returns the directory prefix (possibly empty) and the final segment.
		*/
		function pathPartsOf(path) {
			const trimmed = path.replace(/[/\\]+$/, "");
			if (trimmed === "") return {
				directory: "",
				name: path
			};
			const cut = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\")) + 1;
			return {
				directory: trimmed.slice(0, cut),
				name: trimmed.slice(cut)
			};
		}
		//#endregion
		//#region src/client/audio.ts
		/**
		* Browser audio capability facts for the recognized preview suffixes: the MIME
		* candidates one Blob may carry and the compact byte counts the body displays.
		*/
		/** Audio suffixes the preview renderer claims, without a leading dot. */
		const AUDIO_EXTENSIONS = [
			"mp3",
			"wav",
			"ogg",
			"flac",
			"m4a",
			"aac",
			"opus"
		];
		/**
		* MIME candidates per suffix, in preference order. A codec name may sit in a
		* container (an m4a is an MPEG-4 container, opus usually ships in Ogg), so the
		* capability probe walks the list instead of trusting one name.
		*/
		const MIME_CANDIDATES = {
			aac: ["audio/aac", "audio/x-aac"],
			flac: ["audio/flac"],
			m4a: [
				"audio/mp4",
				"audio/aac",
				"audio/mpeg"
			],
			mp3: ["audio/mpeg"],
			ogg: [
				"audio/ogg; codecs=opus",
				"audio/ogg; codecs=vorbis",
				"audio/ogg"
			],
			opus: ["audio/ogg; codecs=opus", "audio/ogg"],
			wav: [
				"audio/wav",
				"audio/x-wav",
				"audio/wave"
			]
		};
		/**
		* Name the MIME candidates a filename's suffix may carry.
		* @param path - decoded workspace file path.
		* @returns the candidate list, or undefined for an unclaimed suffix.
		*/
		function audioMimeCandidates(path) {
			const normalized = path.replaceAll("\\", "/");
			const name = normalized.slice(normalized.lastIndexOf("/") + 1).toLowerCase();
			const extension = name.slice(name.lastIndexOf(".") + 1);
			return MIME_CANDIDATES[extension];
		}
		/**
		* Render a byte count in compact unit form in the page's language.
		* @param bytes - non-negative byte count.
		* @returns the formatted count.
		*/
		function formatBytes(bytes) {
			return new Intl.NumberFormat(void 0, {
				notation: "compact",
				style: "unit",
				unit: "byte"
			}).format(bytes);
		}
		//#endregion
		//#region \0dsh-css:src/client/AudioPlayerBody.module.css.mjs
		const css = "._0MfIlq_body{box-sizing:border-box;flex-direction:column;gap:8px;width:100%;min-height:100%;padding:12px;display:flex}._0MfIlq_caption{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:16px;overflow:hidden}._0MfIlq_size{color:var(--dsw-alias-label-tertiary)}._0MfIlq_audio{width:100%;display:block}._0MfIlq_line{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:16px}";
		const tagId = "dsh-client-ui-audio-player/AudioPlayerBody.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-client-ui-audio-player";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var AudioPlayerBody_module_css_default = {
			"audio": "_0MfIlq_audio",
			"body": "_0MfIlq_body",
			"caption": "_0MfIlq_caption",
			"line": "_0MfIlq_line",
			"size": "_0MfIlq_size"
		};
		//#endregion
		//#region src/client/AudioPlayerBody.tsx
		/** Complete audio bytes presented as one native media element with a file caption. */
		/**
		* The session and path one `dsh-resource://file/…` address names.
		* @param address - a tab's file resource address.
		* @returns the Session-scoped file the read runs under, or undefined outside that scope.
		*/
		function sessionFileOf(address) {
			const parsed = parseFileAddress(address);
			if (parsed?.scope !== "session") return void 0;
			return {
				sessionId: parsed.sessionId,
				path: parsed.path
			};
		}
		/**
		* Present a previewed audio file: the windowed read, the browser capability
		* check, the native player, and the one unsupported state the Host cannot see.
		* @param props - document content request, file address, load face, and locale.
		* @returns loading progress, the player with its caption, or the unsupported line.
		*/
		function AudioPlayerBody(props) {
			const { tab } = props.useTabInfo();
			const { readAll, supportsType, resourceAddress, t } = props;
			const request = props.content.kind === "renderer" ? props.content : void 0;
			const file = (0, react.useMemo)(() => sessionFileOf(resourceAddress), [resourceAddress]);
			const revision = request?.revision;
			const [state, setState] = (0, react.useState)({
				kind: "loading",
				offset: 0,
				total: void 0
			});
			(0, react.useEffect)(() => {
				if (request === void 0 || file === void 0 || tab.signal.aborted) return;
				const controller = new AbortController();
				const signal = AbortSignal.any([controller.signal, tab.signal]);
				let url;
				setState({
					kind: "loading",
					offset: 0,
					total: void 0
				});
				readAll(file, signal, (progress) => {
					if (!signal.aborted) setState({
						kind: "loading",
						offset: progress.offset,
						total: progress.total
					});
				}).then((result) => {
					if (signal.aborted) return;
					if (!result.ok) {
						if (result.cancelled) return;
						setState({ kind: "failed" });
						request.failed();
						return;
					}
					const mediaType = audioMimeCandidates(file.path)?.find((type) => supportsType(type));
					if (mediaType === void 0) {
						setState({ kind: "unsupported" });
						return;
					}
					const objectUrl = URL.createObjectURL(new Blob([...result.parts], { type: mediaType }));
					url = objectUrl;
					setState({
						kind: "ready",
						url: objectUrl,
						bytes: result.bytes
					});
					request.loaded(result.version);
				}, () => {
					if (!signal.aborted) {
						setState({ kind: "failed" });
						request.failed();
					}
				});
				return () => {
					controller.abort();
					if (url !== void 0) URL.revokeObjectURL(url);
				};
			}, [
				revision,
				resourceAddress,
				file,
				tab.signal,
				readAll,
				supportsType
			]);
			if (request === void 0 || file === void 0 || state.kind === "failed") return null;
			const { name } = pathPartsOf(file.path);
			if (state.kind === "ready") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: AudioPlayerBody_module_css_default.body,
				"data-audio-player": "ready",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					className: AudioPlayerBody_module_css_default.caption,
					children: [name, state.bytes !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: AudioPlayerBody_module_css_default.size,
						children: [" · ", formatBytes(state.bytes)]
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("audio", {
					className: AudioPlayerBody_module_css_default.audio,
					controls: true,
					preload: "metadata",
					src: state.url,
					onError: () => {
						setState({ kind: "unsupported" });
					}
				})]
			});
			if (state.kind === "unsupported") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: AudioPlayerBody_module_css_default.body,
				"data-audio-player": "unsupported",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: AudioPlayerBody_module_css_default.caption,
					children: name
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: AudioPlayerBody_module_css_default.line,
					role: "alert",
					children: t("unsupported")
				})]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: AudioPlayerBody_module_css_default.body,
				"data-audio-player": "loading",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: AudioPlayerBody_module_css_default.caption,
					children: name
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					className: AudioPlayerBody_module_css_default.line,
					children: [t("loading"), state.total !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
						" · ",
						formatBytes(state.offset),
						" / ",
						formatBytes(state.total)
					] })]
				})]
			});
		}
		//#endregion
		//#region src/client/audio-reader.ts
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
		async function readAudioFile(file, readWindow, signal, onProgress) {
			let offset = 0;
			let length = WINDOW_BYTES;
			const parts = [];
			let total;
			let version;
			for (;;) {
				if (signal.aborted) return {
					ok: false,
					cancelled: true
				};
				const result = await readWindow(file.sessionId, file.path, {
					offset,
					length
				}, signal);
				if (!result.ok) {
					if (result.error.code === "gateway/cancelled") return {
						ok: false,
						cancelled: true
					};
					if (result.error.code === "workspace-file/too-large" && result.error.details.limit < length) {
						length = result.error.details.limit;
						continue;
					}
					return {
						ok: false,
						cancelled: false,
						failure: result.error
					};
				}
				const window = result.value;
				total ??= window.bytes;
				version = window.version;
				if (window.data.byteLength > 0) parts.push(window.data);
				offset += window.data.byteLength;
				onProgress({
					offset,
					total
				});
				if (window.eof || window.data.byteLength === 0) return {
					ok: true,
					parts,
					version,
					bytes: total
				};
			}
		}
		//#endregion
		//#region src/client/locales.ts
		/** Locale-owned copy for the audio preview renderer, one dictionary per language. */
		/** This package's namespace, merged into the slot locale map by the client entry. */
		const NS = "audioPlayer";
		/**
		* English dictionary. The shipped locales must keep identical key sets;
		* Host read failures use the preview owner's own failure lines.
		*/
		const en = {
			title: "Audio",
			loading: "Loading audio…",
			unsupported: "This browser cannot play this audio format. Convert the file to MP3 and try again."
		};
		/** Chinese dictionary. */
		const zh = {
			title: "音频",
			loading: "正在加载音频…",
			unsupported: "此浏览器无法播放该音频格式。请将文件转换为 MP3 后重试。"
		};
		/** Russian dictionary, registered with the language pack this plugin contributes. */
		const ru = {
			title: "Аудио",
			loading: "Загрузка аудио…",
			unsupported: "Этот браузер не может воспроизвести данный формат аудио. Конвертируйте файл в MP3 и повторите."
		};
		//#endregion
		//#region src/client/index.ts
		/** This renderer's implementation id, shared by the metadata and the keyed body slot. */
		const BODY_ID = "dsh-client-ui-audio-player";
		/** Required services: the slot registry, copy, the preview registry, and the workspace byte reader. */
		const inject = [
			"slots",
			"locale",
			"documentPreviews",
			"remote",
			"remote.workspaceFiles"
		];
		/**
		* The audio body's inject face: the windowed complete read bound to the
		* Remote, and the browser capability probe.
		* @param ctx - client root context carrying the Remote.
		* @returns the face the registration hands to the body.
		*/
		function audioFace(ctx) {
			const supportsType = (type) => {
				const answer = new Audio().canPlayType(type);
				return answer === "probably" || answer === "maybe";
			};
			return {
				readAll: (file, signal, onProgress) => readAudioFile(file, (sessionId, path, range, readSignal) => ctx.remote.workspaceFiles.readBytes(sessionId, path, { range }, readSignal), signal, onProgress),
				supportsType
			};
		}
		/**
		* Client plugin body: register the dictionaries, the Russian language pack,
		* the preview metadata, and the keyed audio body, each as a reversible effect.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const t = ctx.locale.bind(NS);
			const face = audioFace(ctx);
			ctx.effect(() => ctx.locale.register(NS, {
				en,
				zh
			}), "audio-player: dictionaries");
			ctx.effect(() => ctx.locale.addLanguage({
				id: "ru",
				label: "Русский",
				fallback: "en"
			}), "audio-player: Russian language");
			ctx.effect(() => ctx.locale.register(NS, "ru", ru), "audio-player: Russian dictionary");
			ctx.effect(() => ctx.documentPreviews.register({
				id: BODY_ID,
				extensions: [...AUDIO_EXTENSIONS],
				binaryExtensions: [...AUDIO_EXTENSIONS],
				title: () => t("title"),
				loading: "renderer",
				wrap: false
			}), "audio-player: preview metadata");
			ctx.effect(() => ctx.slots.inject("sidebar.right.tab.document", () => ctx.slots.register({
				name: "sidebar.right.tab.document",
				key: BODY_ID,
				locale: NS,
				inject: () => face
			}, AudioPlayerBody)), "audio-player: body");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map