# registry
> in docker

## setup
- volume
  - /path/auth:/auth
  - /path/certs:/certs
  - /path/data:/var/lib/registry
  - /path/config.yml:/etc/docker/registry/config.yml
- environment
  - REGISTRY_AUTH=htpasswd
  - REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd
  - REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm
  - REGISTRY_HTTP_TLS_KEY=/certs/server.key
  - REGISTRY_HTTP_TLS_CERTIFICATE=/certs/server.crt

## push
- docker tag novel-api:v0.0.v15 192.168.0.0.124:5000/username/novel-api:v0.0.15
- docker login 192.168.0.0.124:5000
- docker push 192.168.0.0.124:5000/username/novel-api:v0.0.15
docker:tUwFyYppK4jJdO6jqR5yzVry5yNhDhpS4A2dHKGdjf8