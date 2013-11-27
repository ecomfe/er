/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 路由器对象
 * @author otakustay
 */
define(
    function (require) {
        var routes = [];
        var backup = null;

        /**
         * 在`locator`的`redirect`事件中，执行路由逻辑
         *
         * @param {Object} e 事件对象
         * @param {string} e.url 当前的URL
         * @ignore
         */
        function executeRoute(e) {
            var url = require('./URL').parse(e.url);
            var path = url.getPath();
            for (var i = 0; i < routes.length; i++) {
                var route = routes[i];

                if ((route.rule instanceof RegExp 
                    && route.rule.test(path))
                    || route.rule === path
                ) {
                    route.handler.call(null, url);
                    return;
                }
            }

            if (backup) {
                backup.call(null, url);
            }

            require('./events').fire('route', { url: url });
        }

        /**
         * @class router
         *
         * 路由器对象
         * 
         * 路由用于将特定的URL对应到特定的函数上，
         * 并在URL变化（{@link locator}对象支持）时，执行相应的函数
         * 
         * URL与函数的对应规则有3种形式：
         * 
         * - 当使用字符串作为规则时，URL的`path`部分与字符串完全匹配
         * - 当使用正则表达式作为规则时，URL的`path`部分匹配该正则
         * - 当所有路由规则均不匹配某个URL时，会调用{@link router#setBackup}提供的函数
         *
         * @singleton
         */
        var router = {
            /**
             * 添加一条路由规则
             *
             * @param {string | RegExp} rule 匹配URL的`path`部分的字符串或正则表达式
             * @param {Function} handler 匹配成功时执行的函数
             */
            add: function (rule, handler) {
                routes.push({ rule: rule, handler: handler });
            },

            /**
             * 添加后备处理函数，当一个路径无规则命中时，将执行此函数
             *
             * @param {Function} handler 后备处理函数
             */
            setBackup: function (handler) {
                backup = handler;
            },

            /**
             * 开始`router`对象的工作
             */
            start: function () {
                require('./locator').on('redirect', executeRoute);
            }
        };

        return router;
    }
);
