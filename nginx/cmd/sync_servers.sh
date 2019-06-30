#!/bin/bash
rsync -vzrtopg --progress ./vars.conf root@site_alias:/etc/nginx/vars.conf
rsync -vzrtopg --progress ./servers/ root@site_alias:/etc/nginx/servers/
ssh root@site_alias "service nginx restart"
