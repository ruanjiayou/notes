#!/bin/bash
npm run build
rsync -vzrtopg --progress ./build/ root@baidu:/home/password/static/
ssh root@baidu "cd /home/password/ && sh cmd.sh"