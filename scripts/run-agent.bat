@echo off
cd /d "%~dp0..\agent"
npx @langchain/langgraph-cli dev --host 127.0.0.1 --port 8123 --no-browser
