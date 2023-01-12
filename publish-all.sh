# build is required, publish don't trigger build.
npm run build

# publish one by one.
sh -c "cd packages/utils && npm unpublish -f && npm publish"
sh -c "cd packages/annotation && npm unpublish -f && npm publish"
sh -c "cd packages/components && npm unpublish -f && npm publish"

