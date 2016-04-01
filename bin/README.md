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
on the cloud server. To solve this we create a reverse-ssh tunnel
from the LAN machine (running the master `mongod`) `A` to the cloud
server `B`.

Here you can see cloud server `B` cannot access `A` because it is 
behind a firewall.

```
A ----|--> B
      |<--
```

By opening up an ssh connection from `A` to `B` that specifically
requests traffic to host `B:7000` to be routed to `A:2003` (where
the master `mongod` daemon is running) we can can then specify 
`localhost:7000` as the master `source` when launching `B`'s `mongod`.

```
ssh -R 0.0.0.0:7000:127.0.0.1:2003 user@B
```
See the accepted answer to 
[this Stack Overflow question](http://serverfault.com/questions/478171/r\everse-ssh-tunnel-connexion-refused) 
if a connection is not being established on `B:7000`.