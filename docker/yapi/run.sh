#!/bin/bash

isFileExists() {
  echo $1;
  if [ ! -d $1 ]; then
    return 0
  else
    return 1
  fi
}
echo "check installing"
isFileExists "/my-yapi/vendors/server/app.js"
res=$?;
if [ $res == 0 ]
then
  echo "install"
  echo `yapi server && node /my-yapi/vendors/server/app.js`
else
  echo "running"
  node /my-yapi/vendors/server/app.js
fi