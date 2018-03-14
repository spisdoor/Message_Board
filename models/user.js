var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
	username: String,
	password: String,
	email: String
});
var User = mongoose.model('User', userSchema);
module.exports = User;
