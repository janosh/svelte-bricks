### Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

#### [v0.3.2](https://github.com/janosh/svelte-bricks/compare/v0.3.1...v0.3.2)

- Masonry.svelte add columnStyle prop (closes #44) [`#44`](https://github.com/janosh/svelte-bricks/issues/44)

#### [v0.3.1](https://github.com/janosh/svelte-bricks/compare/v0.3.0...v0.3.1)

> 8 March 2025

- Migrate kitchen sink in readme.md to svelte 5 syntax [`#43`](https://github.com/janosh/svelte-bricks/pull/43)
- Add `col-{index}` CSS classes to Masonry columns [`#42`](https://github.com/janosh/svelte-bricks/pull/42)
- Type `children` `Snippet` params [`#41`](https://github.com/janosh/svelte-bricks/pull/41)
- Migrate project from node to Deno [`#38`](https://github.com/janosh/svelte-bricks/pull/38)
- Type `children` `Snippet` params (#41) [`#39`](https://github.com/janosh/svelte-bricks/issues/39)

#### [v0.3.0](https://github.com/janosh/svelte-bricks/compare/v0.2.1...v0.3.0)

> 15 February 2025

- Migrate to Svelte 5 [`#37`](https://github.com/janosh/svelte-bricks/pull/37)
- Warn if `maxColWidth &lt; minColWidth` [`#33`](https://github.com/janosh/svelte-bricks/pull/33)
- Fix `nCols` formula missing `gap` in numerator [`#31`](https://github.com/janosh/svelte-bricks/pull/31)

#### [v0.2.1](https://github.com/janosh/svelte-bricks/compare/v0.2.0...v0.2.1)

> 22 September 2023

- Add `types` field to `package.json` [`#26`](https://github.com/janosh/svelte-bricks/pull/26)
- Fixed misleading binding in usage example snippet [`#24`](https://github.com/janosh/svelte-bricks/pull/24)

#### [v0.2.0](https://github.com/janosh/svelte-bricks/compare/v0.1.7...v0.2.0)

> 23 May 2023

- DRY workflows [`#20`](https://github.com/janosh/svelte-bricks/pull/20)
- Small stuff [`#19`](https://github.com/janosh/svelte-bricks/pull/19)
- Deploy site to GitHub Pages [`#17`](https://github.com/janosh/svelte-bricks/pull/17)
- `yarn` to `pnpm` [`#16`](https://github.com/janosh/svelte-bricks/pull/16)
- add Masonry example rendering dynamically loaded images (closes #5) [`#5`](https://github.com/janosh/svelte-bricks/issues/5)
- add changelog.md [`d5f0a97`](https://github.com/janosh/svelte-bricks/commit/d5f0a9712f4b84e2d23451b71fd619c28301964e)
- upgrade svelte-package to v2 [`6b70850`](https://github.com/janosh/svelte-bricks/commit/6b7085029c5f6b5a0671a833da97fa8ac283ed15)
- use code fences to document props in readme [`e282a7f`](https://github.com/janosh/svelte-bricks/commit/e282a7fb4bbd8fae33abc1747757e9c1cf1b06b6)
- test that readme documents no non-existent props [`4198f55`](https://github.com/janosh/svelte-bricks/commit/4198f55bd61465e1ad97442b665391ea09ee9acd)
- tweak readme, update deps, add error page [`974d0e9`](https://github.com/janosh/svelte-bricks/commit/974d0e96b9b296af16eea32d6e4d5523a396c92d)
- simplify readme props testing [`283e02e`](https://github.com/janosh/svelte-bricks/commit/283e02e004a22f498113d7684038fb45e15bee18)
- update deps and fix sveltekit breaking changes [`36d9e77`](https://github.com/janosh/svelte-bricks/commit/36d9e771a58141f3da888c5605d80608cceb2076)
- replace svelte-github-corner with svelte-zoo [`e9e5d0b`](https://github.com/janosh/svelte-bricks/commit/e9e5d0b1575d48815887ea36ec5b9a1bcedad45f)
- update to vite v3 [`35493b9`](https://github.com/janosh/svelte-bricks/commit/35493b9f5a7fe44420cd8d5f4f5a77410532678f)
- setup root+site dir alias and clean up imports [`5325c2b`](https://github.com/janosh/svelte-bricks/commit/5325c2b74ecc5b107ffa47d5e92f376288f2d460)
- tweak CSS for fetch-images-example.svelte [`5a1754c`](https://github.com/janosh/svelte-bricks/commit/5a1754c5f5e17a5387dca9cc1675c5e1dc00e325)
- sveltekit routes auto migration [`54d2a44`](https://github.com/janosh/svelte-bricks/commit/54d2a4494b61ebd9543b715eec0294ba8eb47b6c)

#### [v0.1.7](https://github.com/janosh/svelte-bricks/compare/v0.1.6...v0.1.7)

> 10 May 2022

- Add props `idKey: string` and `getId = (item) =&gt; string | number` [`#11`](https://github.com/janosh/svelte-bricks/pull/11)
- Add props `idKey: string` and `getId = (item) =&gt; string | number` (#11) [`#10`](https://github.com/janosh/svelte-bricks/issues/10)

#### [v0.1.6](https://github.com/janosh/svelte-bricks/compare/v0.1.5...v0.1.6)

> 11 April 2022

- Add class props for use with CSS frameworks like Tailwind [`#9`](https://github.com/janosh/svelte-bricks/pull/9)

#### [v0.1.5](https://github.com/janosh/svelte-bricks/compare/v0.1.4...v0.1.5)

> 4 March 2022

- Testing [`#6`](https://github.com/janosh/svelte-bricks/pull/6)

#### [v0.1.4](https://github.com/janosh/svelte-bricks/compare/v0.1.3...v0.1.4)

> 17 January 2022

- reduce duplication by importing readme into demo site [`8410fe0`](https://github.com/janosh/svelte-bricks/commit/8410fe07423557247afa276cd45df5bdc0a2d13c)
- refactor index.svx: split out Example.svelte code [`9fa2b0c`](https://github.com/janosh/svelte-bricks/commit/9fa2b0c5565aec8042da18285b7e55cac5100cc9)
- drop deprecated svelteBracketNewLine [`46e84cb`](https://github.com/janosh/svelte-bricks/commit/46e84cbfb363a34708cf7229a340f0e21bcf7c28)
- Masonry make crossfade transition local [`4debb8f`](https://github.com/janosh/svelte-bricks/commit/4debb8f4161faa82ccac242f206a9f6b6e159235)

#### [v0.1.3](https://github.com/janosh/svelte-bricks/compare/v0.1.2...v0.1.3)

> 3 November 2021

- auto-generate demo-site docs [`0a5f0da`](https://github.com/janosh/svelte-bricks/commit/0a5f0da2826a519bb691f20fc4ef06acb2fa944f)
- add inline css style prop, add eslint pre-commit [`2cb9e2d`](https://github.com/janosh/svelte-bricks/commit/2cb9e2dbe20a163f8c4d5aeaeedec8ac11867f88)

#### [v0.1.2](https://github.com/janosh/svelte-bricks/compare/v0.1.1...v0.1.2)

> 20 October 2021

- add Toggle.svelte to control Box.svelte slideFlip prop [`22a68bc`](https://github.com/janosh/svelte-bricks/commit/22a68bc4328bb75c363661cb8c106cdc36310830)
- add pre-commit hooks + update deps [`91baae9`](https://github.com/janosh/svelte-bricks/commit/91baae9497647762b6da00f0ee2732b9a1e624d3)
- update deps + readme [`e7fca39`](https://github.com/janosh/svelte-bricks/commit/e7fca394b7bb9ca4b787af3554577170a6adbed2)
- fix Item type [`65cd139`](https://github.com/janosh/svelte-bricks/commit/65cd1391ba1050f223948cd96fb1cf992e925d79)
- update readme [`74ba715`](https://github.com/janosh/svelte-bricks/commit/74ba715d3ba77e2be6bb206cc86f686eb66c2efd)

#### [v0.1.1](https://github.com/janosh/svelte-bricks/compare/v0.1.0...v0.1.1)

> 13 July 2021

- fix item type [`2dc4dfc`](https://github.com/janosh/svelte-bricks/commit/2dc4dfcd02e6cd5243e64de9cf0316c5c3faee8d)

#### v0.1.0

> 13 July 2021

- initial commit [`1a85f29`](https://github.com/janosh/svelte-bricks/commit/1a85f29860a0418ae1845d4aeb5bfeb2c45ff5ef)
- convert to typescript & svelte-kit package [`7d10029`](https://github.com/janosh/svelte-bricks/commit/7d100295e0c0860a71d908e25cea8bab9f2ad0d7)
- convert from sapper to svelte-kit [`1e7991d`](https://github.com/janosh/svelte-bricks/commit/1e7991d8cfe26edd3e4a8549f27a5710b0ae233f)
- move components into own folder, add collapsible docs to App.svx [`4c06e9c`](https://github.com/janosh/svelte-bricks/commit/4c06e9cd00f4416cd8aaa111013db2e11da360fb)
- add usage docs to readme [`c724f9d`](https://github.com/janosh/svelte-bricks/commit/c724f9d0ec9d5142d291bf07544d189936d58265)
- fix random color generator, flip cards on click [`25b5fe5`](https://github.com/janosh/svelte-bricks/commit/25b5fe5a915136a14f7500e4ef5cb703b18adda6)
- add min/maxColWidth + gap controls [`35a4590`](https://github.com/janosh/svelte-bricks/commit/35a4590fecb1a0b3364e5fcdd3854c89fc60d073)
- upgrade deps [`205cb41`](https://github.com/janosh/svelte-bricks/commit/205cb4190dad269ab7134aa327c086804cd76ee0)
- extract global.css from index.svx [`c38d3b7`](https://github.com/janosh/svelte-bricks/commit/c38d3b7d7131849a95b0221aca21c9e0fd525b3b)
- add optional flip animation (defaults to true) [`54c5c76`](https://github.com/janosh/svelte-bricks/commit/54c5c76a929756caf86efd864cc7182108f2e3fa)
