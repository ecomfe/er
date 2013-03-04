define(
    function(require) {
        return {
            version: '${version}',

            start: function() {
                require('./controller').start();
                require('./router').start();
                require('./locator').start();
            }
        };
    }
);