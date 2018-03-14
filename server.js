var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

app.set('port', process.env.PORT || 8000);

app.set("view engine", 'ejs');

app.use(require('body-parser')());

var fs = require('fs');

var cookieParser = require('cookie-parser');
app.use(cookieParser('my_cookie_secret'));

var session = require('express-session');
app.use(session({
	secret: 'my_session_secret',
	cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

var mongoose = require('mongoose');
var opts = {
	server: {
		socketOptions: { keepAlive: 1 }
	}
};

mongoose.connect('lalala');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log('Database Connected.');
});

mongoose.Promise = global.Promise;

var User = require('./models/user.js');
var Post = require('./models/post.js');
var Response = require('./models/response.js');

//index
app.get('/', function(req, res) {

	var task = new Promise(function(resolve, reject) {
		//點選文章
		Post.find({ _id: req.session.postId }, function(err, posts) {
			thisPost = {
				posts: posts.map(function(Post) {
					return {
						thisPostTitle: Post.posttitle,
						thisPostContent: Post.postcontent,
						thisPostOwner: Post.postowner,
					}
				})
			};
		});
		resolve();
	});

	task
	.then(function() {
		//點選文章的留言
		Response.find({ responsepost: req.session.postId }, function(err, responses) {
			responseContext = {
				responses: responses.map(function(Response) {
					return {
						responseContent: Response.responsecontent,
						responseOwner: Response.responseowner,
						responseDate: Response.responsedate,
						_id: Response._id
					}
				})
			};
		});
	})

	.then(function() {
		//預設文章
		var defaultPost = true;
		if (req.session.postId != null)
			defaultPost = false;

		//所有文章
		Post.find({ }, function(err, posts) {
			var context = {
				thisPost: thisPost.posts,
				responses: responseContext.responses,
				defaultPost: defaultPost,
				username: req.session.username,
				posts: posts.map(function(Post) {
					return {
						posttitle: Post.posttitle,
						postcontent: Post.postcontent,
						postowner: Post.postowner,
						_id: Post._id,
					}
				})
			};
			res.render('index', context);
		});
	});

});

//index
app.post('/', function(req, res) {

	//儲存點選文章
	if (req.body.postId != null) {
		req.session.postId = req.body.postId;
		return res.redirect(303, '/');
	}

	//刪除文章
	if (req.body.postDelete != null) {
		Response.remove({ responsepost: req.session.postId }, function(err) {
			if (err) {
				console.error(err.stack);
			}
		});
		Post.remove({ _id: req.session.postId }, function(err) {
			if (err) {
				console.error(err.stack);
				return res.redirect(303, '/');
			}
			delete req.session.postId;
			return res.redirect(303, '/');
		});
	}

	//刪除留言
	else if (req.body.responseDelete != null) {
		Response.remove({ _id: req.body.responseDelete }, function(err) {
			if (err){
				console.error(err.stack);
				return res.redirect(303, '/');
			}
			return res.redirect(303, '/');
		});
	}

	//留言
	else if (req.body.responsecontent != null) {
		Response.update(
			{ responsedate: Date.now() },
			{ responsecontent: req.body.responsecontent,
			  responseowner: req.session.username,
			  responsepost: req.session.postId },
			{ upsert: true },
			function(err) {
				if (err) {
					console.error(err.stack);
					return res.redirect(303, '/');
				}
				return res.redirect(303, '/');
			}
		);
	}

});

//signup
app.get('/signup', function(req, res) {
	var context = {
		username: req.session.username,
	}
	res.render('signup', context);
});

//signup
app.post('/signup', function(req, res) {
	User.update(
		{ username: req.body.username },
		{ password: req.body.password,
		  email: req.body.email },
		{ upsert: true },
		function(err) {
			if (err) {
				console.error(err.stack);
				return res.redirect(303, 'signup');
			}
			req.session.username = req.body.username;
			return res.redirect(303, '/');
		}
	);
});

//login
app.get('/login', function(req, res) {
	var context = {
		username: req.session.username,
	}
	res.render('login', context);
});

//login
app.post('/login', function(req, res) {
	User.find(function(err, user) {
		user = user.map(function(User) {
			if (req.body.username == User.username && req.body.password == User.password) {
				req.session.username = req.body.username;
			}
		});
		if (req.session.username) {
			res.redirect(303, '/');
		}
		else {
			res.redirect(303, 'login');
		}
	});
});

//logout
app.get('/logout', function(req, res) {
	delete req.session.username;
	delete req.session.postId;
	res.redirect(303, '/');
});

//newpost
app.get('/newpost', function(req, res) {
	var context = {
		username: req.session.username
	};
	res.render('newpost', context);
});

//newpost
app.post('/newpost', function(req, res) {
	Post.update(
		{ postdate: Date.now() },
		{ posttitle: req.body.posttitle,
		  postcontent: req.body.postcontent,
		  postowner: req.session.username },
		{ upsert: true },
		function(err) {
			delete req.session.postId;
			if (err) {
				console.error(err.stack);
				return res.redirect(303, 'newpost');
			}
			return res.redirect(303, '/');
		}
	);
});

//updatepost
app.get('/updatepost', function(req, res) {
	Post.find({ _id: req.session.postId }, function(err, posts) {
		var thisPost = {
			username: req.session.username,
			posts: posts.map(function(Post) {
				return {
					thisPostTitle: Post.posttitle,
					thisPostContent: Post.postcontent
				}
			})
		};
		res.render('updatepost', thisPost);
	});
});

//updatepost
app.post('/updatepost', function(req, res) {
	Post.update(
		{ _id: req.session.postId },
		{ posttitle: req.body.posttitle,
		  postcontent: req.body.postcontent },
		{ upsert: true },
		function(err) {
			if (err) {
				console.error(err.stack);
				return res.redirect(303, 'updatepost');
			}
			return res.redirect(303, '/');
		}
	);
});

app.use(function(req, res, next) {
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function() {
	console.log("Server started on", app.get('port'));
});
