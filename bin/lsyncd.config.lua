----
-- User configuration file for lsyncd.
--

-- get the name of the directory housing this config script
local pwd = string.gsub(debug.getinfo(1).source, "^@(.+/)[^/]+$", "%1")

settings {
	logfile = pwd .. "../log/lsyncd.log",
	-- statusFile = "/var/log/lsyncd/lsyncd-status.log",
	statusInterval = 10
}

sync {
	default.rsyncssh, 
	source= pwd .. "../data/thumbnails", 
	host="admin@labs.brangerbriz.com", 
	targetdir="/home/admin/emerge2016/data/thumbnails",
	rsync = {
		compress = true,
		acls = true,
		verbose = true,
		rsh = "/usr/bin/ssh -i " .. pwd .. "../data/server-key -o StrictHostKeyChecking=no" 
	}
}