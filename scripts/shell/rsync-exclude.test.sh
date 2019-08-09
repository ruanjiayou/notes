#!/usr/bin bash
rsync -av ./ --exclude .git/ --exclude node_modules/ root@baidu:/home/repo
echo "finished"