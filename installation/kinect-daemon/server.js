var Kinect = require(__dirname + '/node-kinect/kinect');
var kinect = new Kinect({device: 0});
var util = require('util');

var app = require('./../node_modules/express')();
var server = require('http').Server(app);
var io = require('./../node_modules/socket.io')(server);

// kinect.start('video');
kinect.start('depth');

kinect.resume();

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

	kinect.on('depth', function(buf) {
		socket.emit('kinect-depth', buf);
	});
});

server.listen(8008);
console.log('listening on http://localhost:8008');
