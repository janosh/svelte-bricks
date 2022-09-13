import Masonry from '$lib'
import { readFileSync } from 'fs'
import { expect, test } from 'vitest'

const readme = readFileSync(`readme.md`, `utf8`)

test(`readme documents all props and their correct types and defaults`, () => {
  const instance = new Masonry({
    target: document.body,
    props: { items: [] },
  })
  const { props, ctx } = instance.$$

  for (const [prop, ctx_idx] of Object.entries(props)) {
    let default_val = ctx[ctx_idx as number]
    const type: string = typeof default_val

    if (type === `string`) default_val = `'${default_val}'`

    if ([`string`, `number`, `boolean`].includes(type)) {
      const expected = `1. \`\`\`ts\n   ${prop}: ${type} = ${default_val}\n   \`\`\``

      expect(readme).to.contain(expected)
    } else {
      expect(readme).to.contain(`1. \`\`\`ts\n   ${prop}: `)
    }
  }
})
