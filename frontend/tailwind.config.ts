import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: { extend: { fontFamily: { display: ['Newsreader', 'serif'], sans: ['DM Sans', 'sans-serif'], mono: ['DM Mono', 'monospace'] } } }
}
