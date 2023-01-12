# Development Guide

## How to build

```bash
npm install
npm run build
```

## How to publish

Create [Gitlab Token](https://gitlab.shlab.tech/-/profile/personal_access_tokens) for npm login.
Gitlab Token's `Select scopes` can be `api`.

```bash
npm config set registry https://npm.shlab.tech

# Use your gitlab account name as username.
# Use personal_access_token as password.
npm login

sh -c "cd packages/utils && npm unpublish -f && npm publish"
sh -c "cd packages/annotation && npm unpublish -f && npm publish"
sh -c "cd packages/components && npm unpublish -f && npm publish"

# or run all-in-one script
sh publish-all.sh
```
