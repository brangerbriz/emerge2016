var express = require('express');
var app = express();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/emerge'); 

// test connection ............
var db = mongoose.connection;
db.on('error',function(err){ console.log(err); });
db.once('open', function() { console.log('connected to emerge mongodb'); });

var SessionModel = require('./../data/models/session');

// defaults -----------------
app.set('json spaces', 4);

// static files ---------------
app.use(express.static(__dirname +'/public'));
app.use(express.static(__dirname +'/../share'));


// templates ---------------
app.engine('html', require('hogan-express'));
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

// verbs ---------------
app.get('/api/sessions', function (req, res){	
	
	if (typeof req.query.id === 'string') {
		SessionModel.findOne({ id: req.query.id }, function (err, doc) {
			if (err) {
				console.error(err);
				res.json(getAPIErrorJSON("No results found.", 1));
				return;
			}
			
			res.json({ data: doc });
		});

	} else {
		res.json(getAPIErrorJSON("A valid id must be included as a url"
		                       + " parameter (e.g. /api/session?id=foo)", 2));
	}
});

app.get('/api/leapstream', function (req, res){	
	
	if (typeof req.query.sessionId === 'string') {
	
	SessionModel.findOne({ sessionId: req.sessionId }, function (err, doc) {

		if (err) {
			console.error(err);
			res.json(getAPIErrorJSON("No results found.", 1));
			return;
		}
		
		res.json({ data: doc });
	});

	} else {
		res.json(getAPIErrorJSON("A valid sessionId must be included as a url"
							   + " parameter (e.g. /api/leapstream?sessionId=foo)", 2));
	}
});

app.get('/:id', function(req, res, next) {

	var id = "";
	if (typeof req.params.id !== 'undefined') {
		id = req.params.id;
	}

	res.render('index', { title: 'microsite', id: id });
});

app.get('/', function (req, res){
	res.render('index', { title: 'microsite' });
});


// serve it --------------- 
var server = app.listen(3000, function () {
  console.log('listening at http://localhost:%s', server.address().port);
});

function getAPIErrorJSON(message, number) {
	return { error: { message: message, number: number } };
}

