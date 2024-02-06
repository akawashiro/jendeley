#!/bin/bash -eux

rootdir=$(git rev-parse --show-toplevel)
versions=(
  # TODO: Do not skip pre 1.0.0 versions
  # "0.0.1"
  # "0.0.2"
  # "0.0.3"
  # "0.0.4"
  # "0.0.5"
  # "0.0.6"
  # "0.0.7"
  # "0.0.8"
  # "0.0.9"
  # "0.0.10"
  # "0.0.11"
  # "0.0.12"
  # "0.0.13"
  # "0.0.14"
  # "0.0.15"
  # "0.0.16"
  # "0.0.17"
  # "0.0.18"
  # "0.0.19"
  # "0.0.20"
  # "0.0.21"
  # "0.0.22"
  # "0.0.23"
  # "0.0.24"
  # "0.0.25"
  # "0.0.26"
  # "0.0.27"
  "1.0.0"
  "1.0.1"
  "1.0.2"
  "1.0.3"
  "1.0.4"
  "1.0.5"
  "1.0.6"
  "1.0.7"
  "1.0.8"
  "1.0.9"
  "1.0.10"
  "1.1.0"
  "1.1.1"
  "1.2.0"
  "1.3.0"
  "2.0.2"
  "2.0.4"
  "2.0.5"
  "2.0.6"
  "2.0.7"
  "2.0.9"
  "2.0.10"
  "2.0.12"
  "2.1.1"
  "2.1.2"
  "2.1.3"
  "2.2.0"
)

mkdir -p ${rootdir}/jendeley-backend/generated_DBs
process_list=()
for version in "${versions[@]}"; do
    echo "Generating DB for version $version"
    workdir=$(mktemp -d -t gen_DBs-for-all-versions-${version}-XXXXXXXXXX)
    cp -r ${rootdir}/jendeley-backend/test_pdfs ${workdir}/test_pdfs
    rm -rf ${workdir}/test_pdfs/jendeley_db.json
    echo "#! /bin/bash -eux" > ${workdir}/gen_DB.sh
    echo "npm install -g @a_kawashiro/jendeley@${version}" >> ${workdir}/gen_DB.sh
    echo "jendeley scan --papers_dir /workdir/test_pdfs --book_dirs /workdir/test_pdfs/dummyTapl" >> ${workdir}/gen_DB.sh
    docker run --volume /${workdir}:/workdir --rm node:21 bash /workdir/gen_DB.sh && cp ${workdir}/test_pdfs/jendeley_db.json ${rootdir}/jendeley-backend/generated_DBs/jendeley_db_${version}.json &
    process_id=$!
    process_list+=(${process_id})
done

for p in "${process_list[@]}"; do
    wait ${p}
done
