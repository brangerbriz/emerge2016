#!/bin/bash

# This script needs to be run only once per installation machine.
# It installs the necessary bluetooth tools and configures them
# to be able to communicate with the POGO Polaroid printer.
# See this link for more info: http://bit.ly/1MhYlBw

SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
PRINTER_MAC=$(cat "$DIR_NAME/../data/printer.mac")

if [[ $(whoami) != "root" ]] ; then
	echo "This script must be run as root"
	exit 1
fi

# install packages
sudo apt-get install bluetooth bluez bluez-utils ussp-push

# Add the POGO Polaroid pin number
# NOTE: this method lazily assumes there is only one bluetooth device and may
# not work if there is more than one. If this is the case add pincodes file manually
BLUETOOTH_MAC=$(ls /var/lib/bluetooth)
sudo echo "$PRINTER_MAC 6000" > "/var/lib/bluetooth/$BLUETOOTH_MAC/pincodes"