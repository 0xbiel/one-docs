import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import * as vite from 'vite'
import { resolveConfig } from 'vocs/config'
import { vocs } from 'vocs/vite'

// Vocs delegates Mermaid's browser bundle to Vite. Mermaid imports Day.js as
// a CommonJS default, so explicitly optimize it before the browser can load
// the module. Without this, Vite serves dayjs.min.js as a native module and
// browsers reject its missing `default` export at runtime.
const viteOptions = {
  configFile: false,
  optimizeDeps: {
    include: ['dayjs', '@braintree/sanitize-url'],
  },
  resolve: {
    alias: [
      {
        find: '@braintree/sanitize-url',
        replacement: fileURLToPath(new URL('./sanitize-url-compat.mjs', import.meta.url)),
      },
    ],
  },
}

const command = process.argv[2] ?? 'dev'

if (command === 'dev') {
  const portArgument = process.argv.find((argument) => argument.startsWith('--port='))
  const portIndex = process.argv.indexOf('--port')
  const port = Number(
    portArgument?.slice('--port='.length) ??
      (portIndex >= 0 ? process.argv[portIndex + 1] : undefined) ??
      5173,
  )
  const hostIndex = process.argv.indexOf('--host')
  const host = hostIndex >= 0 ? process.argv[hostIndex + 1] ?? true : undefined
  const server = await vite.createServer({
    ...viteOptions,
    plugins: [react(), ...(await vocs())],
    server: { port, ...(host !== undefined && { host }) },
  })
  await server.listen()
  server.printUrls()
} else if (command === 'build') {
  const config = await resolveConfig()
  const builder = await vite.createBuilder({
    ...viteOptions,
    plugins: [react(), ...(await vocs())],
    build: { outDir: config.outDir },
  })
  await builder.buildApp()
} else {
  throw new Error(`Unsupported Vocs command: ${command}`)
}
