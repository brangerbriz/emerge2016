var spawn = require('child_process').spawn;

launchKinectDaemon();

function launchKinectDaemon() {

	var proc = spawn('bash', [__dirname + '/launch_kinect_daemon.sh']);

	proc.stdout.on('data', function (data) {
	  process.stdout.write(data);
	});

	proc.stderr.on('data', function (data) {
		// console.log('stderr:', data.toString());
		process.stderr.write(data);
	  	if(isError(data.toString())) {
	  		proc.kill('SIGTERM');
	  	}
	});

	proc.on('close', function (code) {
	  console.log('child process exited with code', code);
	  setTimeout(launchKinectDaemon, 1000);
	});
}

function isError(data) {
	if (data.indexOf("USB camera marked dead, stopping streams") !== -1) return true;
	else if (data.indexOf("(node) warning: possible EventEmitter memory leak detected") !== -1) return true;
	else if (data.indexOf("Error: No kinect devices present") !== -1) return true;
	else if (data.indexOf("total packets in 0 frames (inf lppf)") !== -1) return true;
	else return false;
}

