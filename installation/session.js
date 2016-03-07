var shortid = require('shortid');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
/*
var seshSchema = new Schema({
	// _id: ObjectId,
	// id: {
	// 	type: String,
	// 	unique: true,
	// 	index: true,
	// 	'default': shortid.generate
	// },
	// sessionStart: { type: Date, default: Date.now },
	// sessionEnd: Date, // set this once the session has finished
	// urlAvailable: { type:Boolean, default:false },
	// keyFrames: [
	// 	{ 
	// 		// _id: ObjectId, ???
	// 		depthData: String
	// 	}
	// ]		
	name: String
});

module.exports = mongoose.model('frame', seshSchema);
*/

var seshSchema = mongoose.Schema({
    name: String
});

// var Session =  new mongoose.model('session', seshSchema);

// module.exports = {
// 	Session: Session
// }

module.exports = mongoose.model('session', seshSchema);