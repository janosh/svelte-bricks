import { readFileSync } from 'fs'
import { expect, test } from 'vitest'
import Masonry from '../src/lib'

test(`readme documents all props`, () => {
  const readme = readFileSync(`readme.md`, `utf8`)

  const instance = new Masonry({
    target: document.body,
    props: { items: [] },
  })

  for (const prop of Object.keys(instance.$$.props)) {
    expect(readme).to.contain(`- \`${prop}: `)
  }
})
