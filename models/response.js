var mongoose = require('mongoose');
var responseSchema = mongoose.Schema({
	responsedate: Date,
	responsecontent: String,
	responseowner: String,
	responsepost: String
});
var Response = mongoose.model('Response', responseSchema);
module.exports = Response;
