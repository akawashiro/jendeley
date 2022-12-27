#! /bin/bash -eux

cd jendeley-frontend
npm run build
cd ../jendeley-backend
npm run build
npm publish --dry-run
