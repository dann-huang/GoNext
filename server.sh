#!/bin/sh

case "$1" in
  up)
    docker compose up -d
    ;;
  build)
    docker compose up  --build -d
    ;;
  rebuild)
    docker compose up  --build --force-recreate -d
    ;;
  down)
    docker compose down
    ;;
  clear)
    docker compose down --volumes --rmi local
    ;;
  fsh)
    docker compose exec next sh -i
    ;;
  bsh)
    docker compose exec go sh -i
    ;;
  flog)
    docker compose logs next -f
    ;;
  blog)
    docker compose logs go -f
    ;;
  *)
    echo "Usage: $0 {up|build|down|clear|fsh|bsh|flog|blog}"
    exit 1
    ;;
esac
