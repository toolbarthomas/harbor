#!/bin/bash
node index.js --task=run --minify

if [ $? -eq 0 ]
then
  echo "Success"
else
  echo "Error">&2
fi
