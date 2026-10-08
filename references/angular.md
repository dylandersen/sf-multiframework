# Angular UIBundles

React and Angular are both documented app frameworks in the
[current template guide](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-generate-app.html).
Reviewed 2026-10-08 alongside
[Angular Recipes](https://github.com/trailheadapps/multiframework-recipes/tree/main/force-app/main/angular-recipes).

Use `angularinternalapp` or `angularexternalapp` with `sf template generate project`;
use `angularbasic` with `sf template generate ui-bundle` in an existing DX project.
Do not replace the user's Angular app with React to reuse this skill's assets.

## Preserve the Salesforce toolchain

Inspect `angular.json`, `package.json`, `esbuild/`, and `middleware/` together.
The recipes use `@salesforce/angular-plugin-ui-bundle`, custom esbuild builders,
HTML/proxy middleware, and production API-version injection. A generic Angular
scaffold alone does not reproduce org auth/proxy/runtime integration.

Run bundle-local scripts. The guide supports `npm run dev` and `npx ng serve`;
current recipes use `sf-angular-serve` behind `dev`. Build with the configured
`ng build` pipeline, and check where `index.html` actually lands. Recipes set
`outputPath.base: "dist"` and `outputPath.browser: ""`, plus `deployUrl: "./"`.
If a scaffold instead emits `dist/browser`, align `ui-bundle.json.outputDir`
with that directory rather than pointing at its parent.

## Data and lifecycle

The framework-agnostic Data SDK works in Angular services/components:
`createDataSDK`, `graphql?.query<T,V>`, `graphql?.mutate<T,V>`, `fetch?.`, and
query `subscribe`/`refresh` have the same contracts as React. Guard missing
capabilities and partial results. Update signals/state through the project's
chosen Angular pattern; detach query/host subscriptions on destruction and avoid
applying async results after destruction. Use Angular routing with the generated
base path and the platform SPA fallback.

Recipe-specific constraint: helpers named in an eagerly evaluated `@Component`
`imports` array must be declared before the consuming class. React's recipe-first
file ordering does not apply in that case. See [recipe-conventions.md](recipe-conventions.md).

## Validation and scope

Use Angular's existing `*.spec.ts` tests and `ng test` pipeline. The guide documents
`npm run build:e2e` followed by `npm run e2e` for static Playwright coverage.
React/Vitest/TSX examples in `assets/` are not Angular starters.

Internal app access and external site metadata are shared platform concerns.
General Angular hosting support does **not** establish support for internally
hosted Angular microfrontends: that specific embedding page still says React only.
See [microfrontends.md](microfrontends.md) before proposing embedding.
