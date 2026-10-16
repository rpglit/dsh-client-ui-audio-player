import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle(import.meta.dirname, ['lib/types/index.js'])
