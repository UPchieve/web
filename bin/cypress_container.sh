#!/usr/bin/env bash

(npm run dev) &
echo 'starting to wait'
sleep 30
echo 'done waiting'
node_modules/.bin/cypress run