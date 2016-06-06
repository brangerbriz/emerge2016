var express = require('express');
var app = express();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:4005/liveworx'); 

// test connection ............
var db = mongoose.connection;
db.on('error',function(err){ console.log(err); });
db.once('open', function() { console.log('connected to liveworx mongodb'); });

var SessionModel = require('./models/session');

// defaults -----------------
app.set('json spaces', 4);

// static files ---------------
app.use(express.static(__dirname +'/public'));
app.use(express.static(__dirname +'/../share'));
app.use(express.static(__dirname +'/../data/thumbnails'));


// templates ---------------
app.engine('html', require('hogan-express'));
app.set('views', __dirname + '/views');
app.set('view engine', 'html');



// ----- api paths
app.get('/api/sessions', function (req, res){	
	
	if (typeof req.query.id === 'string') {
		SessionModel.findOne({ id: req.query.id }, function (err, doc) {
			if (err) {
				console.error(err);
				res.json(getAPIErrorJSON("No results found.", 1));
				return;
			}
			
			res.json({ data: doc });
		}).read('sp');

	} else {
		res.json(getAPIErrorJSON("A valid id must be included as a url"
		                       + " parameter (e.g. /api/session?id=foo)", 2));
	}
});

app.get('/api/sessions-list', function (req, res){	
	
	SessionModel.find({}, {"id":1,"keyFrames.length":1,"sessionStart":1,"_id":0}, function (err, doc) {
		if (err) {
			console.error(err);
			res.json(getAPIErrorJSON("No results found.", 1));
			return;
		}
		
		res.json({ data: doc });
	}).read('sp');
});

app.get('/api/session-frame-count', function (req, res){	

	SessionModel.findOne({ id: req.query.id },{"id":1,"keyFrames.length":1,"sessionStart":1,"_id":0}, function (err, doc) {
		if (err) {
			console.error(err);
			res.json(getAPIErrorJSON("No results found.", 1));
			return;
		}
		res.json({ data: doc });
	}).read('sp');
});

// ----- microsite paths

app.get('/', function (req, res){
	res.render('index', { title: 'LiveWorx Portraits' });
});

app.get('/gallery', function (req, res){
	res.render('gallery', { title: 'LiveWorx Portraits' });
});

app.get('/about', function (req, res){
	res.render('about', { title: 'LiveWorx Portraits' });
});


app.get('/latest', function (req, res){
	res.render('latest', { title: 'LiveWorx Portraits' });
});

app.get('/:id', function(req, res, next) {

	var id = "";
	if (typeof req.params.id !== 'undefined') {
		id = req.params.id;
	}

	res.render('portrait', { title: 'LiveWorx Portraits', id: id });
});

// serve it --------------- 
var server = app.listen(3005, function () {
  console.log('listening at http://localhost:%s', server.address().port);
});

function getAPIErrorJSON(message, number) {
	return { error: { message: message, number: number } };
}

