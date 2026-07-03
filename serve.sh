#!/bin/sh
cd /home/z/my-project
while true; do
  npx next dev -p 3000 2>/dev/null
  sleep 2
done
