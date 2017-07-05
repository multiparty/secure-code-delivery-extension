'use strict';

var LEX = require('greenlock-express');
var http = require('http');
//var cors = require('cors')
var express = require('express');

var app = express();
//app.use(cors());


var serverUrl = 'staging';
var lex = LEX.create({
    server: serverUrl,
    acme: require('le-acme-core').ACME.create(),
    challenge: require('le-challenge-fs').create({
        webrootPath: '~/letsencrypt/var/:hostname'
    }),
    store: require('le-store-certbot').create({
        configDir: '~/letsencrypt/etc',
        webrootPath: '~/letsencrypt/var/:hostname'
    }),
    debug: false
});

var server = http.createServer(lex.middleware(app)).listen(8080, function () {
  console.log("Listening on ", this.address());
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Request-Headers", "*"); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.static(__dirname));