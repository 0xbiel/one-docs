// Use the config-only entrypoint so the Node-side config loader does not
// eagerly import Vocs' browser-only icon virtual modules.
import { defineConfig } from 'vocs/config'

export default defineConfig({
  title: 'ONE',
  description: 'Local-first cognitive companion for a clearer day, together.',
  colorScheme: 'light',
  rootDir: '.',
  srcDir: '.',
  logoUrl: '/one-logo.png',
  iconUrl: '/one-logo.png',
  head: {
    link: [{ rel: 'stylesheet', href: '/mermaid.css' }],
  },
  theme: {
    accentColor: {
      light: '#1769e8',
      dark: '#45d6e2',
    },
    variables: {
      color: {
        background: { light: '#e8e8eb', dark: '#0b0e13' },
        backgroundDark: { light: '#111318', dark: '#07090d' },
        backgroundDarkest: { light: '#080a0e', dark: '#050609' },
        backgroundLight: { light: '#ffffff', dark: '#161a22' },
        text: { light: '#111318', dark: '#f7f8fa' },
        text2: { light: '#5b626f', dark: '#a8b0bd' },
      },
      fontFamily: {
        body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        heading: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        mono: '"SFMono-Regular", "Cascadia Code", Menlo, monospace',
      },
    },
  },
  customCss: './style.css',
  topNav: [
    { text: 'Guide', link: '/guide/quickstart' },
    { text: 'Architecture', link: '/architecture/overview' },
    { text: 'API', link: '/api/overview' },
    { text: 'Demo', link: '/demo' },
    { text: 'GitHub', link: 'https://github.com/0xbiel/one' },
  ],
  sidebar: {
    '/guide/': [
      { text: 'Start here', items: [{ text: 'Quickstart', link: '/guide/quickstart' }, { text: 'Add a phone camera', link: '/guide/camera-setup' }, { text: 'Environment setup', link: '/guide/environment' }, { text: 'Demo guide', link: '/demo' }] },
      { text: 'Operate ONE', items: [{ text: 'Docker stack', link: '/guide/docker' }, { text: 'PostgreSQL adapter', link: '/guide/postgresql' }, { text: 'Troubleshooting', link: '/guide/troubleshooting' }, { text: 'Testing', link: '/guide/testing' }] },
    ],
    '/architecture/': [
      { text: 'System', items: [{ text: 'Overview', link: '/architecture/overview' }, { text: 'Repository map', link: '/architecture/repos' }, { text: 'Family mode', link: '/architecture/family' }, { text: 'Object memory & calibration', link: '/architecture/memory' }] },
      { text: 'Clients', items: [{ text: 'Web app', link: '/architecture/web' }, { text: 'Camera mapping', link: '/architecture/camera-mapping' }, { text: 'Real geometry model', link: '/architecture/real-geometry-model' }, { text: 'iOS & RoomPlan', link: '/architecture/ios' }, { text: 'Browser camera pairing', link: '/architecture/browser-camera' }] },
    ],
    '/api/': [
      { text: 'Understand the API', items: [{ text: 'API overview', link: '/api/overview' }, { text: 'Spatial models, maps & detection', link: '/api/spatial-vision' }] },
      { text: 'Contract', items: [{ text: 'Auth, pairing & sessions', link: '/api/auth-sessions' }, { text: 'Schemas & errors', link: '/api/schemas' }, { text: 'Request examples', link: '/api/examples' }] },
      { text: 'Resources', items: [{ text: 'Homes, rooms & calibration', link: '/api/homes' }, { text: 'Consent & privacy', link: '/api/privacy' }, { text: 'Objects, vision & events', link: '/api/observations' }, { text: 'Clips & LiveKit', link: '/api/media' }] },
      { text: 'Family', items: [{ text: 'Check-ins & summaries', link: '/api/checkins' }, { text: 'Members, invites & assistant', link: '/api/family' }, { text: 'Medication plans & reminders', link: '/api/medication' }] },
      { text: 'Operations', items: [{ text: 'Retention & webhooks', link: '/api/operations' }] },
    ],
    '/security/': [
      { text: 'Trust boundaries', items: [{ text: 'Authentication & sessions', link: '/security/authentication' }, { text: 'Privacy by design', link: '/security/privacy' }, { text: 'Security model', link: '/security/model' }, { text: 'Known limitations', link: '/security/limitations' }] },
    ],
  },
})
