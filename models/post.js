var mongoose = require('mongoose');
var postSchema = mongoose.Schema({
    postdate: Date,
	posttitle: String,
	postcontent: String,
	postowner: String
});
var Post = mongoose.model('Post', postSchema);
module.exports = Post;
