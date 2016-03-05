var express = require('express');
var app = express();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/emerge'); 

// test connection ............
var db = mongoose.connection;
db.on('error',function(err){ console.log(err); });
db.once('open', function() { console.log('connected to emerge mongodb'); });
// make schema: http://mongoosejs.com/docs/guide.html
// var docSchema = mongoose.Schema({
//     depthdata: String
// });
// // make model w/schema: http://mongoosejs.com/docs/models.html
// var FrameDoc = mongoose.model('frame', docSchema);

var FrameDoc = require('./../data/models/session');


// static files ---------------
app.use(express.static(__dirname +'/public'));

// templates ---------------
app.engine('html', require('hogan-express'));
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

// verbs ---------------
app.get('/', function (req, res){	
	
	FrameDoc.find(function (err, doc) {
		if (err) return console.error(err);
		// var arr = new Buffer( doc[16].depthdata ).toArrayBuffer(); 
		// 
		var resData = doc[0].depthdata.toString("base64");
		var buff =  new Buffer(resData, "base64");
		// console.log( new Uint16Array(buff) );
		var arr = new Uint16Array(buff);

		res.render('index', { title: 'microsite', data: arr[0] }); 
	});
	

});


// serve it --------------- 
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('listening at http://%s:%s', host, port);
});

