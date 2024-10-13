#! /bin/bash -eux
#
# This script launch the ollama server for jendely.
#
# See the following links for the license and use policy of the llama3.2 model.
# https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE
# https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md

ollama_container_name=ollama-used-by-jendeley
ollama_dir=/tmp/ollama-used-by-jendeley
mkdir -p ${ollama_dir}

docker run \
    --publish 11434:11434 \
    --name ${ollama_container_name} \
    --rm \
    --detach \
    -v ${ollama_dir}:/root/.ollama \
    ollama/ollama
sleep 2
docker exec -it ${ollama_container_name} bash -c "ollama pull llama3.2"
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "What is 1 + 1?",
  "stream": false
}'

echo "ollama server is ready to use. Press Ctrl+C to stop the server."
docker attach ${ollama_container_name}
