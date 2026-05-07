# Deployment

Live URL: https://baditaflorin.github.io/n-body-universe/

Repository: https://github.com/baditaflorin/n-body-universe

GitHub Pages is configured to serve `main` branch `/docs`.

## Publish

```sh
make build
git add docs
git commit -m "chore: publish pages build"
git push
```

## Rollback

Revert the publishing commit and push:

```sh
git revert <commit>
git push
```

## Custom Domain

No custom domain is configured for v1. If one is added later, place `CNAME` in `docs/` and configure DNS according to GitHub Pages documentation.

## Pages Notes

The Vite base path is `/n-body-universe/`. GitHub Pages does not support `_headers` or `_redirects`, so `404.html` is used as the SPA fallback.
