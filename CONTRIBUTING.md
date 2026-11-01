# Contributing

Keep changes focused on the public website. Product behavior, CLI, API,
contracts, and documentation belong in
[`Dragon-kanji/Kurobara`](https://github.com/Dragon-kanji/Kurobara).

## Development

Use Node.js `24.22.1` and npm `10.9.4`.

```sh
npm ci
npm run dev
```

Before opening a pull request:

```sh
npm run check
npm run typecheck
npm test
npm run build
```

Formatting and linting use Biome `2.5.5` directly. The local
[`tooling/ultracite-core.biome.jsonc`](./tooling/ultracite-core.biome.jsonc)
preset preserves the rules from Ultracite `7.9.4`; its provenance and MIT
license are recorded in [third-party notices](./THIRD_PARTY_NOTICES.md).
`npm run check` checks files without writing; `npm run fix` applies safe
fixes. Both commands accept file paths after `--`.

For layout or interaction changes, verify desktop and mobile views. Keep the
site static, accessible, fast, and free of tracking or runtime secrets.

Contributors must have the right to submit every code, text, asset, and
generated artifact in their change. Preserve required licenses and notices.
Sign commits with the Developer Certificate of Origin:

```sh
git commit --signoff
```

Contributions are distributed under [Apache-2.0](./LICENSE).
