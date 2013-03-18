define(
    function (require) {
        /**
         * main模块，没啥用
         */
        var main = {
            version: '${version}',

            start: function () {
                require('./controller').start();
                require('./router').start();
                require('./locator').start();
            }
        };
        
        return main;
    }
);