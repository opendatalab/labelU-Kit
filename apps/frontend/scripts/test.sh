#!/bin/bash

if [ $# -lt 2 ]; then
  echo "Usage: $0 <date> <version>"
  exit 1
fi

date="$1"
version="$2"
js_file="$3"

if [ ! -f "$js_file" ]; then
  echo "Error: $js_file does not exist"
  exit 1
fi

sed -i "s/\"backend\": \".*\"/\"backend\": \"$date - $version\"/" "$js_file"

echo "Backend field updated in $js_file"
