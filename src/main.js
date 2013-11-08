define(
    function (require) {
        /**
         * main模块，没啥用
         */
        var main = {
            version: '3.1.0',

            start: function () {
                require('./controller').start();
                require('./router').start();
                require('./locator').start();
            }
        };
        
        return main;
    }
);