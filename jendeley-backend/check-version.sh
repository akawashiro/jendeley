#! /bin/bash -eux

version_in_package_json=$(cat package.json | grep version | awk '{print $2}' | tr -d ",;")
version_in_typescript=$(cat src/constants.ts | grep VERSION | awk '{print $4}' | tr -d ",;")

if [[ ${version_in_package_json} == ${version_in_typescript} ]]
then
    exit 0
else
    echo "Version in package.json and src/constants.ts differ."
    exit 1
fi
