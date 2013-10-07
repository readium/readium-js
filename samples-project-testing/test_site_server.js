//This server is here, because we need to go up a directory from the test site for some resources.
var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen(3000);