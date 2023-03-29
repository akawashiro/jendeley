#! /bin/bash -eux

docker build . -f ./Dockerfile
docker build . -f ./Releasable.Dockerfile
docker build . -f ./shellcheck.Dockerfile
