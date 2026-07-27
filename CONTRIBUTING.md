# Contributing

Keep changes focused on the public website. Product behavior, CLI, API,
contracts, and documentation belong in
[`Dragon-kanji/Kurobara`](https://github.com/Dragon-kanji/Kurobara).

## Development

Use Node.js `24.14.0` and npm `10.9.4`.

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

For layout or interaction changes, verify desktop and mobile views. Keep the
site static, accessible, fast, and free of tracking or runtime secrets.

Contributors must have the right to submit every code, text, asset, and
generated artifact in their change. Preserve required licenses and notices.
Sign commits with the Developer Certificate of Origin:

```sh
git commit --signoff
```

Contributions are distributed under [Apache-2.0](./LICENSE).
