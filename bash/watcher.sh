#!/bin/bash
# watcher.sh
# Execute file written to local filesystem 
# guest271314 6-22-2023
# Usage bash watcher.sh input.sh
# License: WTFPLv2 http://www.wtfpl.net/about/

while IFS= read line
do
  if [ "$line" == "tail: '$1' has been replaced;  following new file" ]
  then
    echo "$line"
    bash $1
  fi
done < <(tail -F -s 0 --max-unchanged-stats=0 -n +0 $1 2>&1)
