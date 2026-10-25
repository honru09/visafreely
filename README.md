# visafreely.com

Visa requirements for every passport × destination pair: what you need before you travel,
how long you can stay, and how fresh the information is.

- 199 passports × 198 destinations (39,402 pairs)
- Every pair page shows either a **Last verified** date with the official source it was
  checked against, or the vintage of the underlying dataset — never a verified claim
  without a check behind it
- All corrections are public on [/changelog](https://visafreely.com/changelog/)

## Data

Baseline dataset: [passport-index](https://github.com/imorte/passport-index-data) (MIT),
February 2026 snapshot, pinned commit `9c59780dd0dbaefcbdfa0134d21cd99d0d547509`.
The seed is never edited in place. Corrections live in `data/overrides.json` and
verification records in `data/verified.json`; `scripts/build-data.mjs` merges the layers
at build time (overrides also feed the changelog). Policies with an announced expiry
carry a `valid_until` and are flagged on the pair page.

Each pair tracks two dates separately: `lastVerified` (bumped on every completed
official-source check) and `lastChanged` (set only when the displayed value changes).

## Develop

```sh
npm install
npm run build   # builds the data layer, then the static site
npm run dev
```

Built with Astro, deployed to GitHub Pages via GitHub Actions.
