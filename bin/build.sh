#!/bin/bash -e

# build stage script for Auto-DevOps

if ! docker info &>/dev/null; then
  if [ -z "$DOCKER_HOST" ] && [ "$KUBERNETES_PORT" ]; then
    export DOCKER_HOST='tcp://localhost:2375'
  fi
fi

if [[ -n "$CI_REGISTRY" && -n "$CI_REGISTRY_USER" ]]; then
  echo "Logging to GitLab Container Registry with CI credentials..."
  echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
fi

image_previous="$CI_APPLICATION_REPOSITORY:$CI_COMMIT_BEFORE_SHA"
image_tagged="$CI_APPLICATION_REPOSITORY:$CI_APPLICATION_TAG"
image_latest="$CI_APPLICATION_REPOSITORY:latest"

builder=${AUTO_DEVOPS_BUILD_IMAGE_CNB_BUILDER:-"heroku/buildpacks:18"}
echo "Building Cloud Native Buildpack-based application with builder ${builder}..."
buildpack_args=()
if [[ -n "$BUILDPACK_URL" ]]; then
  buildpack_args=('--buildpack' "$BUILDPACK_URL")
fi
env_args=()
if [[ -n "$AUTO_DEVOPS_BUILD_IMAGE_FORWARDED_CI_VARIABLES" ]]; then
  mapfile -t env_arg_names < <(echo "$AUTO_DEVOPS_BUILD_IMAGE_FORWARDED_CI_VARIABLES" | tr ',' "\n")
  for env_arg_name in "${env_arg_names[@]}"; do
    env_args+=('--env' "$env_arg_name")
  done
fi
pack build "$image_tagged" \
  --builder "$builder" \
  "${env_args[@]}" \
  "${buildpack_args[@]}" \
  --env HTTP_PROXY \
  --env http_proxy \
  --env HTTPS_PROXY \
  --env https_proxy \
  --env FTP_PROXY \
  --env ftp_proxy \
  --env NO_PROXY \
  --env no_proxy \
  --env "NODE_ENV=production"

docker tag "$image_tagged" "$image_latest"

docker push "$image_tagged"
docker push "$image_latest"
