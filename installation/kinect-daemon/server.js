// App will crash after 11 connections :/
// require('events').EventEmitter.defaultMaxListeners = Infinity; // HACK AND NOT WORKING
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
	// socket.setMaxListeners(0); // NOT WORKING
	kinect.on('depth', function(buf) {
		socket.emit('kinect-depth', buf);
	});
});

server.listen(8008);
console.log('listening on http://localhost:8008');
