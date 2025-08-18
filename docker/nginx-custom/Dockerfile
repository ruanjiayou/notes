############################
# 👷 第一阶段：构建 nginx + rtmp 模块
############################
FROM alpine:3.19 AS builder

ENV NGINX_VERSION=1.24.0

# 安装编译依赖
RUN apk add --no-cache \
    build-base \
    pcre-dev \
    openssl-dev \
    zlib-dev \
    git \
    wget

WORKDIR /build

# 下载 nginx 源码
RUN wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz && \
    tar zxvf nginx-${NGINX_VERSION}.tar.gz

# 克隆 rtmp 模块
RUN git clone https://github.com/arut/nginx-rtmp-module.git

# 编译 nginx + rtmp
WORKDIR /build/nginx-${NGINX_VERSION}
RUN ./configure \
    --prefix=/opt/nginx \
    --with-http_ssl_module \
    --add-module=../nginx-rtmp-module && \
    make -j$(nproc) && make install

############################
# 🚀 第二阶段：运行镜像
############################
FROM alpine:3.19

# 安装 nginx 运行时依赖
RUN apk add --no-cache openssl pcre zlib

# 拷贝 nginx 编译产物
COPY --from=builder /opt/nginx /opt/nginx

# 拷贝 nginx.conf（如果你自定义）
COPY nginx.conf /opt/nginx/conf/nginx.conf

# 确保 HLS 目录存在
RUN mkdir -p /opt/nginx/html/hls && mkdir -p /opt/nginx/logs

# 端口：1935 RTMP, 8080 HTTP
EXPOSE 1935 8080

WORKDIR /opt/nginx

CMD ["/opt/nginx/sbin/nginx", "-g", "daemon off;"]
