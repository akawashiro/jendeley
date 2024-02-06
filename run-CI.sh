#! /bin/bash -eux

docker build . -f ./Dockerfile --network=host
docker build . -f ./Releasable.Dockerfile --network=host
docker build . -f ./shellcheck.Dockerfile --network=host
