// Mermaid imports this CommonJS package with a named ESM import. Vite 8's
// rolldown optimizer exposes the package's CommonJS value as `default` only,
// so bridge the named export explicitly while retaining the upstream code.
import sanitizeUrlModule from '../node_modules/@braintree/sanitize-url/dist/index.js'

export const sanitizeUrl = sanitizeUrlModule.sanitizeUrl
export default sanitizeUrlModule
