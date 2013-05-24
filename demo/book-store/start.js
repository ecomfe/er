var fs = require('fs-extra');
var path = require('path');
var express = require('express');

var root = __dirname;
fs.mkdirs(
    path.join(root, 'lib', 'er'),
    function() {
        fs.copy(
            path.join(root, '..', '..', 'src'),
            path.join(root, 'lib', 'er'),
            function(err) {
                var app = express();
                app.use(express.static(root));
                app.listen(8088);
                console.log('visit http://localhost:8088/main.htm');
            }
        );
    }
);