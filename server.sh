#!/bin/sh

case "$1" in
  up)
    sudo docker compose up -d
    ;;
  build)
    sudo docker compose up  --build -d
    ;;
  rebuild)
    sudo docker compose up  --build --force-recreate -d
    ;;
  down)
    sudo docker compose down
    ;;
  clear)
    sudo docker compose down --volumes --rmi local
    ;;
  fsh)
    sudo docker compose exec next sh -i
    ;;
  bsh)
    sudo docker compose exec go sh -i
    ;;
  flog)
    sudo docker compose logs next -f
    ;;
  blog)
    sudo docker compose logs go -f
    ;;
  *)
    echo "Usage: $0 {up|build|down|clear|fsh|bsh|flog|blog}"
    exit 1
    ;;
esac
