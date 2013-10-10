//This server is here, because we need to go up a directory from the test site for some resources.
var connect = require('connect'), http = require('http');

var app = connect()
    .use(connect.logger('short'))
    .use(connect.static(__dirname));


    
http.createServer(app).listen(3000);
