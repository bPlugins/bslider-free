# bSlider (free build)

The WordPress.org build of bSlider. User-facing documentation is in `readme.txt`;
this file is for anyone building the plugin from source.

## Building

```bash
npm install
npm run build     # compiles src/ into build/
npm run zip       # build + i18n + a release zip with only the shipped files
```

### bpl-tools has to be checked out beside this one

`src/` imports shared components from `../../bpl-tools` — the panel controls, the
premium notice components, `getCSS`, and the admin screens. It is a sibling
directory, not an npm dependency, so a clone of this repository alone will not
build:

```
wp-content/plugins/
├── b-slider/      <- this repository
└── bpl-tools/     <- https://github.com/bPlugins/bpl-tools
```

`build/` and `languages/` are generated and gitignored, so a fresh clone must run
`npm run build` (and `npm run i18n` for translations) before the plugin will run.
The release zip carries both.

## What is in the zip

`npm run zip` names what it packages, so nothing here is excluded by accident:
`b-slider.php`, `custom-post.php`, `index.php`, `includes/`, `assets/`, `build/`,
`languages/`, `vendor/` and `readme.txt`. Source, tooling and developer notes stay
out.

## Free and Premium

This build ships every feature it can deliver and **draws no control for one it
cannot**. WordPress.org does not allow options for paid features to be put in
front of the user; naming the feature in a notice is allowed.

- `src/utils/pro-features.js` — every feature named in a notice, named once.
- `ProNotice` / `ProPanel` / `ProCard` (`src/Components/Panel/`) — the three forms
  a notice takes. Nothing else should build one.
- `bin/check-pro.js` — enforces the above. It runs as part of `npm run build` and
  fails the build on:
  1. a `PRO_FEATURES` key nothing reads, or one read that is not declared;
  2. an upsell sentence written at the call site instead of composed;
  3. an attribute default that has drifted from the Premium build;
  4. a panel that writes the free value into an attribute when it finds a Premium
     one saved — which destroys a slider built under a licence;
  5. any `BControlPro`-style locked control.

Where a Premium value has to be ignored, it is ignored **on the way out** and the
saved attribute is left alone — see `PRO_ONLY` in `src/utils/config.js`. Never
correct it with `setAttributes`.

Run the checker on its own with:

```bash
node bin/check-pro.js
```

Rule 3 compares against `../b-slider-pro` and is skipped when that checkout is
absent; the other rules always run.

## Before a release

- `npm run build` — must be clean of errors.
- `node bin/check-pro.js` — must pass.
- `npm run i18n` — regenerates `.pot`, `.json` and `.mo`. Must report no warnings.
- `npm run zip` — rebuild the artifact. Do not upload a zip built before the last
  source change.
- Run the [Plugin Check](https://wordpress.org/plugins/plugin-check/) plugin
  against the built plugin — it is the same tooling the WordPress.org reviewers
  use.
- Version has to match in four places: the plugin header, the
  `B_SLIDER_PLUGIN_VERSION` constant, `src/block.json` and the `Stable tag` in
  `readme.txt`.

## External requests

Every service the plugin contacts is declared in the **External Services**
section of `readme.txt`. Anything added here that makes an outbound request, or
loads an asset from another host, has to be declared there too — including images
a visitor's browser fetches.
