# Changelog

## [1.3.1](https://github.com/martapanc/linkarium/compare/v1.3.0...v1.3.1) (2026-04-11)


### Bug Fixes

* **layout:** move html/body shell to root layout so not-found page inherits styles ([5ccfde9](https://github.com/martapanc/linkarium/commit/5ccfde94c79b31b1bbca0ce94ff1962b561fc053))

## [1.3.0](https://github.com/martapanc/linkarium/compare/v1.2.0...v1.3.0) (2026-04-10)


### Features

* **linkCard:** add copy title action to dropdown menu ([8fe2a74](https://github.com/martapanc/linkarium/commit/8fe2a74e8e428a70403c7a5fb84be7df50053803))


### Bug Fixes

* prevent author initials from being parsed as URLs ([cf454da](https://github.com/martapanc/linkarium/commit/cf454da028a60ffad86e33c050ef0081533ea3fc))

## [1.2.0](https://github.com/martapanc/linkarium/compare/v1.1.0...v1.2.0) (2026-04-10)


### Features

* add i18n support with English and Italian translations ([a44736a](https://github.com/martapanc/linkarium/commit/a44736ae54b6e08120bf8e43e98312ef75cf6c90))
* add server-side feature flags to toggle WriteGuard and LanguageSwitcher ([e328594](https://github.com/martapanc/linkarium/commit/e328594244b3d9d1ee1f48441715d1c01199dbdb))
* **listView:** show different footer based on edit mode ([d701a6b](https://github.com/martapanc/linkarium/commit/d701a6b09b49b2de4406140f264d2d24f86295a5))


### Bug Fixes

* **linkCard:** prevent URL overflow in edit mode and refine card layout ([4a9a3cb](https://github.com/martapanc/linkarium/commit/4a9a3cb09ce2d085ffa0920d31794c23e5e06ea8))

## [1.1.0](https://github.com/martapanc/linkarium/compare/v1.0.0...v1.1.0) (2026-04-10)


### Features

* add academic paper reference support ([04a67e6](https://github.com/martapanc/linkarium/commit/04a67e63437fd0e99f30a4068e435f95bf58fd45))
* **citations:** auto-detect citations in Add links; minimal format; fix PDF scrape ([c551e52](https://github.com/martapanc/linkarium/commit/c551e52d1ade164d1466d122252d9088a72565b9))
* **citations:** require inline URL in batch citation format ([a5d9cfb](https://github.com/martapanc/linkarium/commit/a5d9cfba88e388e0dfcbd37b2bfb2790aa5760f0))
* enrich papers with PDF links via OpenAlex and Unpaywall ([1a3df37](https://github.com/martapanc/linkarium/commit/1a3df3751bc46257cd13c3eb4a44185d6a54568e))
* implement drag-and-drop reordering and write-access guard ([12407d7](https://github.com/martapanc/linkarium/commit/12407d7f89f17f9044499105fb9a424005c7d0c8))
* implement read-only mode with pw ([9e68097](https://github.com/martapanc/linkarium/commit/9e68097be8642a97c4e39610ffb32355124a6852))
* **link-card:** redesign paper card; fix nested &lt;a&gt; and mobile issues ([968738e](https://github.com/martapanc/linkarium/commit/968738ecada5eb74d346bde86fb4c4f75d0ab941))
* **list:** soft-delete with 30-day hard-delete cron ([ad8ecf8](https://github.com/martapanc/linkarium/commit/ad8ecf8b9e1157cf7588877f71bf9b70377731b1))


### Bug Fixes

* **link-card:** prevent action menu from clipping behind sibling cards ([f47bc1f](https://github.com/martapanc/linkarium/commit/f47bc1fdce6d840753fbe701745248412e50d31b))
* **LinkCard:** prevent long URLs from overflowing card on mobile ([cb133d0](https://github.com/martapanc/linkarium/commit/cb133d08306f013fcfce73a1a392029e5abc8567))
* **SearchFilterBar:** allow filter row to wrap on mobile ([cd92a73](https://github.com/martapanc/linkarium/commit/cd92a734ff8c599a027f752d3b51ef1074d48e96))

## 1.0.0 (2026-04-03)


### Features

* add favicon ([77c0856](https://github.com/martapanc/linkarium/commit/77c0856a9d1ec9ba4d19a649cb371d0e2a6f6633))
* add favicon ([e8b6022](https://github.com/martapanc/linkarium/commit/e8b60226f3518459fc822033064dbb90141bda49))
