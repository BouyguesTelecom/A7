#!/usr/bin/env sh

#
# Copyright 2021 - Bouygues Telecom
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

if [ "$A7_PATH_AUTO_EXPAND_INIT" != "true" ] && [ "$A7_PATH_AUTO_EXPAND_INIT" != "always" ]; then
  echo "ENV A7_PATH_AUTO_EXPAND_INIT set to '$A7_PATH_AUTO_EXPAND_INIT'; Let's bypass the directories metadata generation step KTHXBYE."
  return
fi

# Given a root directory, outputs all of its mod_zip-compatible file entries
# Outputs mod_zip-compatible file entries
#
# Example output:
#   - 20 /assets/bob@1.3.3/dist/index.css index.css
#   - 45 /assets/bob@1.3.3/dist/index.js index.js
#
directoryEntries () {
  local directory="$1"
  local metadata_filepath="$2"
  local subdir=${directory#"$A7_VOLUME_MOUNT_PATH"}

  # find all files in the currenty directory, recursively
  find "$directory" -type f \
    -not -name ".directory.txt" \
    -exec du -b {} + | \
    awk '{gsub("'$A7_VOLUME_MOUNT_PATH'","",$2); printf ("- %i %s", $1, $2); gsub("'$subdir'/","",$2); printf (" %s\n", $2);}' \
    > "$metadata_filepath"
}

# For each directory, recursively generate its `.directory.txt` metadata file
#
echo "⏹ Generating metadata files…"
find "$A7_VOLUME_MOUNT_PATH" -type d -mindepth 1 | while read -r directory; do
  echo "   $directory"
  metadata_filepath="$root_dir$directory/.directory.txt"

  # if 👇 we either want to force the metadata generation or 👇 the metadata file doesn't exist yet
  if [ "$A7_PATH_AUTO_EXPAND_INIT" = "always" ] || [ ! -e "$metadata_filepath" ]; then
    # generate the file
    directoryEntries "$directory" "$metadata_filepath" &
  fi
done
echo "✔ All metadata files generated."

# Wait for all background tasks completion
#
wait
echo "✔ All tasks completed."
