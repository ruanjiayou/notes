#!/usr/bin bash
set -e
image_name=$1
if [ -z "$image_name" ]
then
  echo "name can't be empty"
  exit
fi
docker pull $image_name
docker tag $image hub.my-docker.com/projects/$image_name
docker push hub.my-docker.com/projects/$image_name
echo "push success"
echo "hub.my-docker.com/projects/$image_name"