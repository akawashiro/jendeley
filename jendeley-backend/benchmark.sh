#! /bin/bash -eu

# echo 0 | sudo tee /proc/sys/kernel/perf_event_paranoid
# NODE_ENV=production  node --inspect dist/index.js benchmark-fuzzy-search --db ~/Dropbox/jendeley-data/jendeley_db.json

npm run build
perf record -F 999 -g node dist/index.js benchmark-fuzzy-search --db ~/Dropbox/jendeley-data/jendeley_db.json
perf script > out.perf
$(ghq root)/github.com/brendangregg/FlameGraph/stackcollapse-perf.pl out.perf > out.folded
$(ghq root)/github.com/brendangregg/FlameGraph/flamegraph.pl out.folded > benchmark.svg
echo "Check benchmark.svg"

rm -f isolate-*v8.log
rm -rf processed-isolate-*v8.log.txt
NODE_ENV=production node --prof dist/index.js benchmark-fuzzy-search --db ~/Dropbox/jendeley-data/jendeley_db.json
for f in isolate-*v8.log; do
  node --prof-process $f > processed-${f}.txt
  echo "Check processed-${f}.txt"
done
