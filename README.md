# dsh-client-ui-audio-player

English | [Русский](README.ru.md)

> **Third-party package.** This is an unofficial community package. It is not
> affiliated with, endorsed by, or maintained by DeepSeek. The code is forked
> from `packages/client/ui-audio-player` in [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)
> (commit `fee78d97`, MIT). DeepSeek may later publish an official
> `@deepseek-ai/dsh-client-ui-audio-player` under the `@deepseek-ai` scope;
> that official scoped package and this unscoped one would carry different
> graph ids and different renderer ids, so they *could* coexist in one profile —
> but a profile should use one or the other to avoid two audio preview
> renderers for the same file suffixes.

## What it does

Adds an audio renderer to the right Sidebar's document preview in the DSH web
GUI:

- claims the `mp3`, `wav`, `ogg`, `flac`, `m4a`, `aac`, and `opus` suffixes;
- plays one file through a native `<audio controls preload="metadata">` element;
- reads the file as complete bytes in **2 MiB windows** over the
  `workspaceFiles.readBytes` Remote, so files above the Host's **32 MiB**
  complete-read cap still play (a window refused as too large shrinks to the
  cap the refusal reports);
- the browser's `canPlayType` probe names the one state the Host cannot see —
  an unsupported codec — with a convert-to-MP3 hint instead of a broken player;
- contributes Russian (`ru`, falling back to English per key) as a selectable
  language with this package's dictionary translated.

Files the Host cannot read show the preview's own failure state; a media
decode error after load swaps the player for the unsupported hint. No audio
bytes leave the browser (Blob URL, revoked on unmount).

## Install

Requires DSH `>=0.2.0 <0.3.0` (declared in `engines.dsh`; installation and
profile startup refuse a bundle whose range the running DSH does not satisfy).

```sh
# from git (the repository ships prebuilt lib/, so no build permission is needed)
dsh plugin --profile web add github:ipetrichenko/dsh-client-ui-audio-player

# once published to npm
dsh plugin --profile web add dsh-client-ui-audio-player

# or a local checkout
dsh plugin --profile web add /path/to/dsh-client-ui-audio-player
```

`dsh plugin` manages the profile's `package.json` dependency and appends the
layer. A client plugin also needs a roster row: append this block to the
profile's `cordis.patch.yml` (`~/.dsh/profiles/web/cordis.patch.yml`) as a
**top-level `- insert:` block** (a new package row has no existing id to
override):

```yaml
- insert:
  - id: ui-audio-player
    name: 'dsh-client-ui-audio-player'
```

`id` is a free-form roster key (kept as `ui-audio-player`); `name` is the npm
name and **is** the module-graph entry identity. Saving the file triggers an
in-place profile re-composition — no server restart.

## Update

- **git install (hot path):** the Host stat-polls every graph row's
  `lib/client.js` every 500 ms and the entry revision is stat-based, so
  `git pull` in the installed copy (which updates the committed `lib/`) is
  picked up automatically: new rev → SSE `rebuilt` frame → the browser adopts
  via HMR, no restart.
- **any install (clean path):**
  ```sh
  dsh plugin --profile web remove dsh-client-ui-audio-player
  dsh plugin --profile web add <same source as before>
  ```
  then re-check the roster row in `cordis.patch.yml`.

## Build from source

Node `^22.19.0 || >=24.0.0`; pnpm via corepack (`pnpm` is not on PATH here):

```sh
corepack pnpm@12.11.2 install    # or: pnpm install
corepack pnpm@12.11.2 run build  # tsc -b tsconfig.json && tsdown → lib/
corepack pnpm@12.11.2 run bundle # tsdown only (re-bundle over existing lib/types)
corepack pnpm@12.11.2 run watch  # tsdown --watch
corepack pnpm@12.11.2 run smoke  # artifact check: factory, stamped id, size — no browser
```

The `build/` directory vendors the harness's shared `clientBundle` tsdown
preset (7 files, MIT, attribution headers; only the import specifiers and
`REPOSITORY_ROOT` were repointed — see each file's header). Prebuilt `lib/`
is **committed on purpose**: git installs ship sources without running any
build script, and a TypeScript package without `lib/` fails to load — so the
bundle you commit is the bundle the profile serves.

## Tests

`tests/audio-player.client.spec.tsx` is a verbatim reference copy of the
upstream spec. It runs inside the `deepseek-harness` monorepo (it imports the
`@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/…` subpath, which
published tarballs do not ship) — the standalone check is `pnpm run smoke`.

## Rollback

```sh
dsh plugin --profile web remove dsh-client-ui-audio-player
```

and delete the `- insert:` block from the profile's `cordis.patch.yml`. The
re-composition removes the graph entry in place — no restart.

## Model experience

None. This is a browser-only viewer: it registers no tool, no prompt section,
and no session event; it only renders a preview body and contributes locale
copy.

## License

MIT. `src/`, `locale/`, and `build/` originate from `deepseek-ai/deepseek-harness`
(MIT, Copyright (c) 2026 DeepSeek); see `LICENSE` and the per-file headers in
`build/`.
