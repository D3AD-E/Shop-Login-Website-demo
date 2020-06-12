//'use strict';
//var http = require('http');
//var port = process.env.PORT || 1337;

//http.createServer(function (req, res) {
//    res.writeHead(200, { 'Content-Type': 'text/plain' });
//    res.end('Hello World\n');
//}).listen(port);
const express = require("express")
const mongoose = require('mongoose')
const passport = require('passport')
const hbs = require('hbs')
const path = require('path') 
require('./src/cfg/passport')(passport)

var flash = require('connect-flash');
const session = require('express-session')
const mongoStore = require('connect-mongo')(session)
const connectionUrl='mongodb://127.0.0.1:27017/Users'
const dbname = 'Users'

mongoose.connect(connectionUrl, { 'useNewUrlParser': true , 'useCreateIndex':true})
    .then(() => console.log('Connected to db'))
    .catch(() => console.log('Failed to connect to db'))

app = express()

app.use(express.urlencoded({ extended: false }))



app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: new mongoStore({ mongooseConnection: mongoose.connection }),
    cookie: { maxAge: 180 * 60 * 1000 }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.use(function (req, res, next) {
    res.locals.session = req.session
    res.locals.userInfo = req.user
    next()
})

app.use('/user', require('./src/routes/user.js'))
app.use('/shop', require('./src/routes/shop.js'))
app.use('/', require('./src/routes/index.js'))

app.use(express.static(path.join(__dirname, 'public')));
const partialsPath = path.join(__dirname, '/views/partials')
hbs.registerPartials(partialsPath) 

const PORT = process.env.PORT || 1337
app.set('view engine', 'hbs') 

app.listen(PORT, console.log('Server started on ' + PORT))

