const express = require('express');
const path = require('path');
const configurationFile = require('./config.json');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const flash = require('connect-flash');


// Setting up Firebase.
const Firebase = require('firebase');

var config = {
    apiKey: configurationFile.apiKey,
    authDomain: configurationFile.authDomain,
    databaseURL: configurationFile.database_url,
    storageBucket: configurationFile.storageBucket,
    messagingSenderId: configurationFile.messagingSenderId
};

Firebase.initializeApp(config);

// App & Body-Parser setup.
var app = express();

// Templating engine.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Logger setup.
app.use(logger('dev'));

// Body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express-validation setup.
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));


// Express-session setup
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Connect-flash setup.
app.use(flash());
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error_message = req.flash("error_message");
    res.locals.authdata = Firebase.auth().currentUser;
    res.locals.page = req.url;
    next();
});

app.get("*", function(req, res, next) {
    if (Firebase.auth().currentUser != null) {
        Firebase
        .database().ref('users')
        .orderByChild("uid")
        .startAt(Firebase.auth().currentUser.uid)
        .endAt(Firebase.auth().currentUser.uid)
        .on("child_added", function(snapshot) {
          res.locals.user = snapshot.val();
        });
    }

    next();
});

// Routing
var users = require('./routes/users');
var routes = require('./routes/index');
var games = require('./routes/games');
var genres = require('./routes/genres');

app.use('/', routes);
app.use('/users', users);
app.use('/games', games);
app.use('/genres', genres);

// Directory setup.
app.use(express.static(path.join(__dirname, 'public')));

// Set port and run server.
app.set('port', configurationFile.port_number);
app.listen(app.get('port'), function() {
    console.log("Server up and running on port: " + app.get('port'));
});

