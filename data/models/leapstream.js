var mongoose = require('./../../microsite/node_modules/mongoose'),
    Schema = mongoose.Schema;

var leapSchema = new Schema({
	// _id: ObjectId,
	sessionID: Number, // the ObjectId of the session this stream corresponds to
	leapData: {
		// the leap stuff
	}		
});

module.exports = mongoose.model('leapstream', leapSchema);