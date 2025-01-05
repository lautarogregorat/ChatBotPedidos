#!/bin/bash
docker rm -f bot 2>/dev/null
docker run \
  --name "bot" \
  --env-file .env \
  --env PORT=3008 \
  -p 3008:3008/tcp \
  -v "$(pwd)/bot_sessions:/app/bot_sessions:rw" \
  --cap-add SYS_ADMIN \
  builderbotbaileys:1.0.0

