# kurobara.systems

Source for the public [Kurobara Systems studio](https://kurobara.systems/)
and the [Kurobara product website](https://kurobara.systems/kurobara/).

It is a static, no-tracking Vite site served by an unprivileged Nginx
container. The Kurobara product, CLI, contracts, and documentation live in
[`Dragon-kanji/Kurobara`](https://github.com/Dragon-kanji/Kurobara).

## Sites and languages

The studio at `/` uses the approved Eclosion design: original rose geometry,
ivory canvas, sparse copy and interactive perspectives for Products, Expertise,
Studio and Contact. The product at `/kurobara/` retains the previously deployed
product design, workflow and CLI quickstart. Each page has its own entry point,
stylesheet and runtime; both are served by the same container.

English is the default. A small EN / FR selector enables French with
`?lang=fr`. Switching keeps the current fragment, workflow selection and other
query parameters. The language follows links between the two sites and works
with browser Back. No cookies or local storage are required.

The build produces English and French HTML, manifests and metadata. Nginx
selects the locale before JavaScript runs. Localized canonical URLs, reciprocal
`hreflang` links, a sitemap and separate social previews cover both sites.
Physical French HTML files are internal; unknown routes return a real 404.

Studio states use `#produits`, `#expertises`, `#studio`, `#contact` and
`#explorer`. Old root `#workflow`, `#contracts` and `#quickstart` bookmarks
redirect to the corresponding product fragment, preserving the query.
The contact action opens the existing public email address in a mail client.
The site itself does not submit a form or send a message.

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
npm run security:audit:all
```

`npm run preview:export` also produces a self-contained Studio HTML preview.
Vite development and preview servers translate French in the browser. Use the
production container to test first-response language selection and redirects.

## Production image

```sh
docker build -t kurobara-website:local .
docker run --rm -p 8080:8080 kurobara-website:local
curl --fail http://127.0.0.1:8080/healthz
npm run test:server
```

The container has no runtime secrets, backend, cookies, or analytics. Production
is deployed behind Coolify and Cloudflare.

Coolify builds this repository's protected `main` branch using the root
Dockerfile. Merge only after the required qualification, CodeQL and dependency
review checks pass, then trigger the existing application's normal deployment.
Check the resulting deployment commit, healthy image and public routes. This
release changes static content and Nginx paths; it needs no DNS, application
secret or ingress change.

Before replacing production, retain the current commit as a release tag and
keep its container image available. If a release fails public verification,
use Coolify's normal rollback to that recorded commit and verify health and
the public page again. Do not edit a running container to deploy content.

## Artwork and interaction

The Studio uses the owner's approved generated wordmark and original rose
vector. Its geometry is preserved while transforms and fills animate the
perspectives. The product keeps its original rose artwork. Locale-specific
social images are captures of the actual rendered websites. Font notices
remain unchanged.

Keyboard focus, Escape, browser history, mobile disclosure navigation and
reduced-motion styles are supported. Without JavaScript, the page content
remains available as an ordinary anchor-linked document.

The Studio optionally exposes two bounded WebMCP page helpers in supporting
browsers: select a visible workflow stage and read the provider-free quickstart
commands. They make no network calls and execute no product jobs. The product
subsite does not register WebMCP tools.

## Contributing

Small, focused pull requests are welcome. Read
[`CONTRIBUTING.md`](./CONTRIBUTING.md) before submitting changes. Report
security issues privately as described in [`SECURITY.md`](./SECURITY.md).

Apache-2.0 licensed. Bundled font notices are documented in
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
