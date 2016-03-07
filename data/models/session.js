var mongoose = require('./../../microsite/node_modules/mongoose'),
    Schema = mongoose.Schema;

var seshSchema = new Schema({
	// _id: ObjectId,
	sessionStart: { type: Date, default: Date.now },
	sessionEnd: Date, // set this once the session has finished
	urlAvailable: Boolean,
	keyFrames: [
		{ 
			// _id: ObjectId, ???
			depthData: String
		}
	]		
});

module.exports = mongoose.model('session', seshSchema);