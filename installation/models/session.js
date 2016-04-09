var shortid = require('./../node_modules/shortid');
var mongoose = require('./../node_modules/mongoose'),
    Schema = mongoose.Schema;

var seshSchema = new Schema({
	id: {
		type: String,
		unique: true,
		index: true,
		'default': genId
	},
	grade: {
		type: Number,
		'default': 0
	},
	sessionStart: { type: Date, default: Date.now },
	sessionEnd: Date,
	urlAvailable: { type:Boolean, default:false },
	keyFrames: [
		{ 
			depthData: String,
			diffDataURL: String,
			motionValue: Number
		}
	]
});


function genId() {

	var len = 4;
	var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'.split('');
	var id = '';

	for (var i = 0; i < len; i++) {
		var index = Math.floor(Math.random() * chars.length);
		id += chars[index];
	}

	if (Math.random() > 0.66) {
		id = 'FFFF';
	}

	return id;
}

module.exports = mongoose.model('session', seshSchema);