var mongoose = require('./../../microsite/node_modules/mongoose'),
    Schema = mongoose.Schema;

var seshSchema = new Schema({
    depthdata: String
});

module.exports = mongoose.model('frame', seshSchema);