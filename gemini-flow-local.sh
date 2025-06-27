#!/bin/bash

# Gemini Code Flow Local Runner
# Convenience script to run gemini-flow from the local development directory

# Set the path to the gemini-code-flow directory
GEMINI_FLOW_DIR="/Users/jokkeruokolainen/Documents/Solita/GenAI/IDE/gemini-code-flow"

# Check if the directory exists
if [ ! -d "$GEMINI_FLOW_DIR" ]; then
    echo "❌ Error: Gemini Code Flow directory not found at $GEMINI_FLOW_DIR"
    echo "Please check the path or run from the correct location."
    exit 1
fi

# Check if the CLI file exists
CLI_FILE="$GEMINI_FLOW_DIR/dist/cli.js"
if [ ! -f "$CLI_FILE" ]; then
    echo "❌ Error: CLI file not found at $CLI_FILE"
    echo "Please run 'npm run build' in the gemini-code-flow directory first."
    exit 1
fi

# Change to the gemini-code-flow directory and run the CLI with all arguments
cd "$GEMINI_FLOW_DIR" && node dist/cli.js "$@"

# Exit with the same code as the CLI
exit $?
