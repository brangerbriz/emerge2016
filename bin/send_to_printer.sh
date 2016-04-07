#!/bin/bash

SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# start_printer.sh should already be running and POGO Polaroid
# printer should be ready to accept prints before this script
# is run.

if [[ $# != 1 ]] ; then
	echo "Usage: $0 <filename.jpg>"
	exit 1
fi

# if <filename.jpg> exists
if [[ -a $1 ]] ; then
	ussp-push /dev/rfcomm0 $1 "$RANDOM.jpg"
else 
	echo "$1 file does not exist."
	exit 1
fi
