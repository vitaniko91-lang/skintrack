// Favicon: lucide:mountain-snow из офлайн-набора Iconify, циан на фоне ground.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const set = JSON.parse(readFileSync(require.resolve('@iconify-json/lucide/icons.json'), 'utf8'))
const body = set.icons['mountain-snow'].body.replaceAll('currentColor', '#5ce8ff')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="8" fill="#04080c"/>
<g transform="translate(4 4)">${body}</g>
</svg>
`
writeFileSync(new URL('../public/favicon.svg', import.meta.url), svg)
console.log('public/favicon.svg', svg.length, 'bytes')
