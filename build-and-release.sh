#! /bin/bash -eux

git checkout main
git pull

pushd ./jendeley-frontend
npm run build
popd

rm -rf ./jendeley-backend/built-frontend
cp -r ./jendeley-frontend/build ./jendeley-backend/built-frontend

pushd ./jendeley-backend
npm run build
npm publish --dry-run

read -p "Do you want to release? (yes/no) " yn

case $yn in
	yes ) echo ok, we will proceed;;
	no ) echo exiting...;
		exit;;
	* ) echo invalid response;
		exit 1;;
esac

npm publish
