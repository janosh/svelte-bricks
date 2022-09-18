import { readFileSync } from 'fs'
import { describe, expect, test } from 'vitest'

const readme = readFileSync(`readme.md`, `utf8`)
const masonry_src = readFileSync(`src/lib/Masonry.svelte`, `utf8`)

describe(`readme`, () => {
  test(`documents all props and their correct types and defaults`, () => {
    for (let line of masonry_src.split(`\n`)) {
      if (line.trim().startsWith(`export let `)) {
        line = line.replace(`export let `, ``).split(` //`)[0].trim()
        line = `1. \`\`\`ts\n   ${line}`

        expect(readme, `${line} not in readme.md`).to.contain(line)
      }
    }
  })
})
