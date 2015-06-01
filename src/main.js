/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 主模块
 * @author otakustay
 */
define(
    function (require) {
        /**
         * @class main
         *
         * 主模块，没啥用
         *
         * @singleton
         */
        var main = {
            /**
             * 当前版本号
             *
             * @type {string}
             */
            version: '3.1.0-rc.2',

            /**
             * 启动ER框架，此方法按顺序启动默认的{@link Controller}、{@link Router}和{@link locator}组件
             */
            start: function () {
                require('./controller').start();
                require('./router').start();
                require('./locator').start();
            }
        };

        return main;
    }
);
