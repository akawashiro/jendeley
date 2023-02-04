FROM ubuntu:22.04

RUN apt update
RUN apt install shellcheck
COPY . /jendeley
WORKDIR /jendeley
RUN shellcheck build-and-release.sh
