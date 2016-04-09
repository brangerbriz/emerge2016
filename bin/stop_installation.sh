#!/bin/bash

SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# kill all processes with pidfiles in pid/
FILES=$(ls "$DIR_NAME/../pid")
for f in $FILES
do
  kill $(cat "$DIR_NAME/../pid/$f")
  if [[ "$?" == "0" ]] ; then
  	echo "Successfully killed pid in $f"
  else
  	echo "Failed to kill pid in $f"
  fi
  rm "$DIR_NAME/../pid/$f"
done

# kill the NW.js app process
APP_PID=$(ps aux | grep "node_modules/nw/nwjs/nw \." | awk '{ print $2 }')
if [[ -n $APP_PID ]] ; then
	kill "$APP_PID"
	if [[ "$?" == "0" ]] ; then
		echo "Successfully killed app process"
	else
		echo "Failed to kill app process"
	fi
else
	echo "App process is not running"
fi 

# release /dev/rfcomm0 used to communicate with the printer
echo "Releasing /dev/rfcomm0 used for printer comm"
rfcomm release /dev/rfcomm0
