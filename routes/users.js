var express = require('express');
var router = express.Router();
const Firebase = require('firebase');

// GET - Register
router.get('/register', function(req, res, next) {
  	res.render('users/register');
});

// POST - Register
router.post('/register', function(req, res, next) {
  	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var confirm_password = req.body.confirm_password;
	var favourite_game = req.body.favourite_game;

	// Validation
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email must be valid.').isEmail();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('confirm_password', 'Passwords must match.').equals(req.body.password);
	
	var errors = req.validationErrors();

	if(errors){
		res.render('users/register', {errors: errors});
	}else{
		Firebase.auth().createUserWithEmailAndPassword(email, password).then(
			function(data){
				var user = {
					uid: data.uid,
					email: email,
					username: username,
					favourite_game: favourite_game
				}

				var userRef = Firebase.database().ref('users');
				userRef.push().set(user);				

				req.flash("success_msg", "You are now registered and may login.");
				res.redirect('/games');
			},
			function(error) {
				console.log("ERROR WHILE REGISTERING USER: "  + error);
			}
		);
	}
});

// GET - Login
router.get('/login', function(req, res, next) {
	if(Firebase.auth().currentUser){
		res.redirect('/games');	
	}else{
  		res.render('users/login');
	}
});

// GET - Logout
router.get('/logout', function(req, res, next){
	Firebase.auth().signOut()
		.then(
			function(){
				req.flash("success_msg", "You are now logged out.");
				res.redirect('/users/login');
			}, 
			function(error){
				req.flash("error_msg", "Error logging out, please try again.");
				res.redirect("/users/login");
			}
		)

});

// POST - Login
router.post('/login', function(req, res, next) {

	var email = req.body.email;
	var password = req.body.password;

	req.checkBody("email", "Email or username is required.").notEmpty();
	req.checkBody("email", "Email must be valid.").isEmail();
	req.checkBody("password", "Password is required.").notEmpty();

	var errors = req.validationErrors();

	if(errors){
		res.render("/user/login", {errors:errors});
	}else{
		Firebase.auth().signInWithEmailAndPassword(email, password)
			.then(
				function(data){
					console.log("LOGGED IN WITH UID: " + data.uid);
					req.flash("success_msg", "You are now logged in.");
					res.redirect('/games');
				},
				function(error){
					console.log("ERROR WHILE LOGGING IN! :" + error);
					req.flash("error_msg", "Login failed - wrong username or password.");
					res.redirect("/users/login");
				}
			)
	}
});


module.exports = router;
