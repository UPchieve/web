#!/bin/bash

set -e

DATETIME=$(date '+%Y-%m-%d:%H-%M-%S')
EMAIL=$(op account list --format json | jq -r '.[0].email')
USER=${EMAIL%@*}
VERSION="${DATETIME}_${USER}"

echo "{\"version\": \"${VERSION}\"}" > public/version.json

if [ "$1" = 'dev' ]; then
  doppler run --token $(op read op://engineering/doppler-high-line-dev/password) -- pnpm run build && \
  swa deploy \
    --deployment-token $(op read op://engineering/swa-token-high-line-dev/password) \
    --resource-group development-resource-group \
    --app-name development-static-web-app \
    --env production ./dist
else
  doppler run --token $(op read op://private/deploy-high-line/doppler-token) -- pnpm run build && \
  swa deploy \
  --deployment-token $(op read op://private/deploy-high-line/swa-deploy-token) \
  --resource-group $(op read op://private/deploy-high-line/resource-group) \
  --app-name $(op read op://private/deploy-high-line/app-name) \
  --env production ./dist
fi
