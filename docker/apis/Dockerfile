FROM ruanjiayou/node:24-chromium

# 安装了curl/vim/chromium/git/bash

WORKDIR /cms

VOLUME ["/cms/static"]

ENV PATH="/usr/local/bin:${PATH}"
ENV NODE_ENV=production
ENV redis_url=redis://192.168.0.124:6379
ENV proxy=http://192.168.0.125:8888
ENV queue_url=http://guest:guest@192.168.0.124:5672
ENV mongo_url=mongodb://root:123456@192.168.0.124:27017/*?authSource=admin

COPY . .

# api 用的环境变量 proxy_agent 要换为 proxy; 
# 各项目替换 mongo_url 中的库名
# demo 3000
# api 3333
# message 8090
# user 8092
# express 8093

RUN npm install -g pm2 && command -v pm2-runtime

EXPOSE 3000

CMD ["pm2-runtime", "ecosystem.config.js"]
