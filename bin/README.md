Start/Stop Scripts
------------------

- `start_installation.sh`: Launch the installation. Should be called on the 
installation machine. This begins the following processes with logging in 
`../log` and pidfiles in `../pid`.
	- Kinect-daemon via `launch_and_poll_kinect_daemon.js`.
	- `mongod` master daemon via `start_mongod_master.sh`.
	- Reverse-ssh tunnel to microsite server via `tunnel.sh`.
	- Launches `lsyncd` to watch and synchronize `../data/thumbnails`
	on installation machine and microsite servers.
	- Installation NW.js app.
- `stop_installation.sh`: Kill all processes with pidfiles in `../pid` as
well as the NW.js installation app (which doesn't have a pidfile or logfile).
- `start_microsite.sh`: Launch and serve the microsite on the microsite
server. This begins the following processes with logging in `../log`.
	- `mongod` slave daemon via `start_mongod_slave.sh`.
	- Serves microsite via `node ../microsite/server.js`.

Helper/Sub Scripts
------------------

- `env.sh`: Set of variable declerations used as a config file and sourced
in many of the other scripts in this directory.
- `start_mongod_master.sh`: Used to launch the MongoDB daemon as a master on the
installation machine. Called from `start_installation.sh`.
- `start_mongod_slave.sh`: Used to launch the MongoDB daemon as a slave on the
microsite server. Called from `start_microsite.sh`.
- `tunnel.sh`: Uses `../data/server-key` (if present) to login to the microsite
server and create a reverse-ssh tunnel that the microsite `mongod` slave uses to
synchronize with the master MongoDB database on the installation machine. Called
from `start_installation.sh`.
- `launch_and_poll_kinect_daemon.js`: A Node.js script that launches 
`launch_kinect_daemon.sh` and continually relaunches it if it experiences an error.
Called from `start_installation.sh`.
- `launch_kinect_daemon.sh`: Execs `node ../installation/kinect-daemon/server.js`
with the correct version of Node.js (v0.10.25). Called from 
`launch_and_poll_kinect_daemon.sh`.
- `kill_kinect_daemon.sh`: Kills `../installation/kinect-daemon/server.js` launched
with `launch_kinect_daemon.sh`.
- `lsyncd.config.lua`: Lua configuration file for `lsyncd` process launched with
`start_installation.sh`.

Printer Related Scripts
-----------------------

- `setup_printer.sh`: Downloads bluetooth dependencies and configures pincode file
on installation machine before the POGO Polaroid printer can be used for the first time
with that machine. This script should only need to be run once manually when installing
this project for the first time on a new machine.
- `start_printer.sh`: Creates a new bluetooth device (`/dev/rfcomm0`) and binds it to
the POGO printer. Must be run before images may be printed with `send_to_printer.sh`.
- `send_to_printer.sh`: Script to send a JPG to the POGO printer with 
`./send_to_printer.sh <filename.jpg>`. 

In order to run `start_printer.sh` and `send_to_printer.sh` without root the user
issuing the command must be added to the `dialout` group. To do this run the following
logged in as the correct user:

```bash
sudo usermod -a -G dialout $USER
```

I've also experienced that `rfcomm` may still refuse to be run by the new user without
changing its setuid bit with:

```
sudo chmod u+s /usr/bin/rfcomm 
```

This seems like a bug, more here: https://bugs.launchpad.net/ubuntu/+source/bluez/+bug/1014992

Replicating the MongoDB database
--------------------------------

This project has a somewhat unique requirement of needing
a secondary database on a cloud server to be kept in sync
with a primary database on the local machine driving the
installation that is hidden behind a firewall. For this
we use the built-in MongoDB master/slave functionality
with the caveat that the slave `mongod` instance's `source`
needs to be pointed towards the master `mongod`. The problem
is that the master is behind a firewall and cannot be regularly
accessed from the internet by the slave `mongod` instance running
on the microsite cloud server. To solve this we create a reverse-ssh tunnel
from the LAN machine (running the master `mongod`) `A` to the cloud
server `B` with `tunnel.sh`.

Here you can see cloud server `B` cannot access `A` because it is 
behind a firewall.

```
A ----|--> B
      |<--
```

By opening up an ssh connection from `A` to `B` that specifically
requests traffic to host `B:7000` to be routed to `A:4003` (where
the master `mongod` daemon is running) we can can then specify 
`localhost:7000` as the master `source` when launching `B`'s `mongod`.

```bash
# example
ssh -R 0.0.0.0:7000:127.0.0.1:4003 user@B
```
See the accepted answer to 
[this Stack Overflow question](http://serverfault.com/questions/478171/r\everse-ssh-tunnel-connexion-refused) 
if a connection is not being established on `B:7000`.