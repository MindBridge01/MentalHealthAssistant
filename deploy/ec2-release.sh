#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd /opt/mindbridge
exec 9>/opt/mindbridge/deployment.lock
flock -n 9 || { echo 'Another deployment is running.'; exit 1; }
test -s runtime.env || { echo 'Provision /opt/mindbridge/runtime.env first.'; exit 1; }
docker compose version >/dev/null
candidate="$1"
test -f "$candidate/compose.yaml"
test -f "$candidate/images.env"
dc() { docker compose --project-name mindbridge --env-file "$candidate/images.env" -f "$candidate/compose.yaml" "$@"; }
dc pull
# Migration failures leave current services running. Schema changes must remain
# backward compatible: restoring images cannot undo a database migration.
dc run --rm --no-deps migrate
previous=$(readlink -f current || true)
if ! dc up -d --wait --wait-timeout 900 web chatbot ingestion models; then
  echo 'New services failed readiness; restoring previous release if available.'
  if [[ -n "$previous" && -f "$previous/images.env" ]]; then
    docker compose --project-name mindbridge --env-file "$previous/images.env" -f "$previous/compose.yaml" up -d --wait --wait-timeout 900 web chatbot ingestion models
  fi
  exit 1
fi
ln -sfn "$candidate" current
echo 'EC2 services are ready. Public smoke checks follow in GitHub Actions.'
