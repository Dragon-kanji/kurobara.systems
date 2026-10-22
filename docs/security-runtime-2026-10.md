# October 2026 runtime security maintenance

Build with Node.js 24.22.1 and serve with unprivileged Nginx 1.30.6.
Both Docker image references are pinned by immutable manifest digest.
Verify nginx -v, nginx -t, /healthz, and public routes after deployment.
