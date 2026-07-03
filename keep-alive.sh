#!/bin/bash
while true; do
  cd /home/z/my-project
  npx next dev -p 3000 2>/dev/null
  echo "Server exited, restarting in 2s..."
  sleep 2
done
