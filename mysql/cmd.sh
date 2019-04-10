#! /bin/bash
docker network create net-mysql
docker-compose down
docker-compose up -d