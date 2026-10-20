#!/bin/bash
cd "$(dirname "$0")/../agent" || exit 1
npx @langchain/langgraph-cli dev --host 127.0.0.1 --port 8123 --no-browser
