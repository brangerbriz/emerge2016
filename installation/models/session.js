var shortid = require('./../node_modules/shortid');
var mongoose = require('./../node_modules/mongoose'),
    Schema = mongoose.Schema;

var seshSchema = new Schema({
	id: {
		type: String,
		unique: true,
		index: true,
		'default': shortid.generate
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

module.exports = mongoose.model('session', seshSchema);