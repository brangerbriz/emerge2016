#!/bin/bash

# Majority of this script taken from the instructions here:
# http://bit.ly/1MhYlBw
SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# if [[ $(whoami) != "root" ]] ; then
# 	echo "This script must be run as root"
# 	exit 1
# fi

PRINTER_MAC=$(cat "$DIR_NAME/../data/printer.mac")
rfcomm bind /dev/rfcomm0 $PRINTER_MAC 1