#!/bin/sh
npx httpyac@6.16.6 ./tests/*.http --silent --json --all -e dev > ./test-output.json
cat ./test-output.json | jq -r '.summary | "Total: \(.totalTests), Passed: \(.successTests), Failed: \(.failedTests)"'
echo "Tests results details will be available under artifact 'http-yac-test-results'"

hasFailedTests=$(cat ./test-output.json | jq -r '.summary.failedTests')

if [ -z "$hasFailedTests" ]; then
  echo "Failed to parse test results"
  exit 1
fi

if [ $hasFailedTests -gt 0 ]; then
  echo "Failed tests :"
  cat ./test-output.json | jq '.requests[] | select(.summary.failedTests != 0) | .name'
  exit 1
fi
