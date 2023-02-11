#! /bin/bash -eux

pushd ./jendeley-frontend
npm install
npm run build
popd

rm -rf ./jendeley-backend/built-frontend
cp -r ./jendeley-frontend/build ./jendeley-backend/built-frontend

pushd ./jendeley-backend
npm install
npm run build
sudo npm install . -g
