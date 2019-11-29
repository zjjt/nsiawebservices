#!/bin/bash

set -e

IMAGE_NAME=${1:-"nsiaviewebservices"}

printf "\n[-] Building $IMAGE_NAME...\n\n"

docker build  -t $IMAGE_NAME:devbuild .
docker build -t $IMAGE_NAME:latest .