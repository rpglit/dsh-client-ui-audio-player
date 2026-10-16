/**
 * Vendored from deepseek-ai/deepseek-harness (MIT License) at commit fee78d97
 * ("Refresh generated catalogs with the audio player package"), snapshot 2026-10-16.
 * Upstream: packages/client/modules/src/client/manifest.ts
 * Copyright (c) 2026 DeepSeek. Full license text: LICENSE at the repository root.
 * Excerpt: the optionalStringArray helper (JSDoc + function) only.
 */
/**
 * Validate an optional string-array field read from a `dsh.client` declaration
 * or from the boot wire.
 * @param subject - diagnostic prefix naming the package or the wire row.
 * @param field - field name as it appears in the diagnostic.
 * @param value - the raw field value.
 * @returns the validated array, or undefined when the field is absent.
 * @throws {Error} when the value is present but is not an array of strings.
 */
export function optionalStringArray(subject: string, field: string, value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`client-modules: ${subject} ${field} must be a string array`)
  }
  return value as string[]
}
