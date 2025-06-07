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
  lint)
    sudo docker compose exec go sh /app/scripts/lint.sh
    ;;
  test)
    sudo docker compose exec go sh /app/scripts/test.sh
    ;;
  sh)
    sudo docker compose exec go sh -i
    ;;
  log)
    sudo docker compose logs go -f
    ;;
  *)
    echo "Usage: $0 {up|build|down|lint|test|sh|log}"
    exit 1
    ;;
esac
