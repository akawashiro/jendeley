#! /bin/bash
set -eux

rootdir=$(git rev-parse --show-toplevel)
workdir=$(mktemp -d -t jendeley_check_update_all_generated_DBs_XXXXX)
cd ${rootdir}/jendeley-backend

ok=0
for db in $(find ${rootdir}/jendeley-backend/generated_DBs -name "*.json" | sort); do
    echo Checking $db
    node --require source-map-support/register dist/index.js update_db --db1 ${db} --db2 ${workdir}/updated_$(basename $db)
    if [[ ! -f ${workdir}/updated_$(basename $db) ]]; then
        ok=1
    fi
done
echo Check ${workdir} for updated DBs
exit $ok
