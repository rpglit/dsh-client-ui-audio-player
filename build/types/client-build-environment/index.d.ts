/**
 * Vendored from deepseek-ai/deepseek-harness (MIT License) at commit fee78d97
 * ("Refresh generated catalogs with the audio player package"), snapshot 2026-10-16.
 * Upstream: scripts/types/client-build-environment/index.d.ts
 * Copyright (c) 2026 DeepSeek. Full license text: LICENSE at the repository root.
 */
/** Build-time values that bundlers replace before client code reaches a browser. */
declare const process: {
  readonly env: {
    readonly NODE_ENV?: string
    readonly [name: `DSH_CLIENT_${string}`]: string | undefined
  }
}
