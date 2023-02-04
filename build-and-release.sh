#! /bin/bash -eux

if [[ $# != 1 ]]
then
    echo You must pass one argument.
    exit 1
fi

if [[ $1 != "major" ]] && [[ $1 != "minor" ]] && [[ $1 != "patch" ]]
then
    echo You must pass one of major, minor or patch.
    exit 1
fi

VERSION_UP_KIND=$1

git checkout main
git pull

# npm version up
pushd ./jendeley-backend

npm version ${VERSION_UP_KIND}
VERSION_NUMBER=$(cat package.json | jq .version)
VERSION_TAG=v${VERSION_NUMBER}
VERSION_DEFINITION_LINE="const JENDELEY_VERSION = ${VERSION_NUMBER};"
sed -i "s/const JENDELEY_VERSION.*/${VERSION_DEFINITION_LINE}/g" src/constants.ts

git add ./package.json src/constants.ts
git commit -m "Release ${VERSION_TAG}"
git push origin main
git tag ${VERSION_TAG}
popd

# Build and copy frontend
pushd ./jendeley-frontend
npm run build
popd

rm -rf ./jendeley-backend/built-frontend
cp -r ./jendeley-frontend/build ./jendeley-backend/built-frontend

# Build and publish package
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
