#!/bin/bash
# Remotion Docs Search MCP Script
# Usage: ./search-remotion.sh "query"

QUERY="$1"

if [ -z "$QUERY" ]; then
    echo "Usage: ./search-remotion.sh <query>"
    exit 1
fi

echo "Searching Remotion docs for: $QUERY"
echo "---"

# Search using DuckDuckGo
curl -s "https://lite.duckduckgo.com/lite/?q=site:remotion.dev+$QUERY" | grep -oP '(?<=<a href=")[^"]+(?=">)' | grep -i "remotion" | head -10

echo "---"
echo "Direct docs links:"
echo "https://www.remotion.dev/docs/"
echo "https://www.remotion.dev/search?q=$(echo $QUERY | tr ' ' '+')"
