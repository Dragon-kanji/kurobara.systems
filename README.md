# kurobara.systems

Source for the public [Kurobara website](https://kurobara.systems/).

It is a static, no-tracking Vite site served by an unprivileged Nginx
container. The Kurobara product, CLI, contracts, and documentation live in
[`Dragon-kanji/Kurobara`](https://github.com/Dragon-kanji/Kurobara).

## Local development

Requirements: Node.js `24.14.0` and npm `10.9.4`.

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

## Production image

```sh
docker build -t kurobara-website:local .
docker run --rm -p 8080:8080 kurobara-website:local
curl --fail http://127.0.0.1:8080/healthz
```

The container has no runtime secrets, backend, cookies, or analytics. Production
is deployed behind Coolify and Cloudflare.

## Contributing

Small, focused pull requests are welcome. Read
[`CONTRIBUTING.md`](./CONTRIBUTING.md) before submitting changes. Report
security issues privately as described in [`SECURITY.md`](./SECURITY.md).

Apache-2.0 licensed. Bundled font notices are documented in
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
