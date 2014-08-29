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
        /**
         * @class Router
         *
         * 路由类
         *
         * 通过`require('er/router').Router`访问该类构造函数，其中`require('er/router')`是该类的全局实例
         *
         * 路由用于将特定的URL对应到特定的函数上，
         * 并在URL变化（{@link locator}对象支持）时，执行相应的函数
         *
         * URL与函数的对应规则有3种形式：
         *
         * - 当使用字符串作为规则时，URL的`path`部分与字符串完全匹配
         * - 当使用正则表达式作为规则时，URL的`path`部分匹配该正则
         * - 当所有路由规则均不匹配某个URL时，会调用{@link Router#setBackup}提供的函数
         *
         * @extends mini-event.EventTarget
         * @constructor
         */
        var exports = {};

        exports.constructor = function () {
            this.routes = [];
            this.backup = null;
        };

        /**
         * 在{{@locator#redirect}事件中，执行路由逻辑
         *
         * @param {mini-event.Event} e 事件对象
         * @param {string} e.url 当前的URL
         * @ignore
         */
        function executeRoute(e) {
            var url = require('./URL').parse(e.url);
            var path = url.getPath();
            for (var i = 0; i < this.routes.length; i++) {
                var route = this.routes[i];

                if ((route.rule instanceof RegExp && route.rule.test(path)) || route.rule === path) {
                    route.handler.call(this, url);
                    return;
                }
            }

            if (this.backup) {
                this.backup(url);
            }

            this.getEventBus().fire('route', { url: url, router: this });
        }

        /**
         * 添加一条路由规则
         *
         * @param {string | RegExp} rule 匹配URL的`path`部分的字符串或正则表达式
         * @param {Function} handler 匹配成功时执行的函数
         */
        exports.add = function (rule, handler) {
            this.routes.push({ rule: rule, handler: handler });
        };

        /**
         * 添加后备处理函数，当一个路径无规则命中时，将执行此函数
         *
         * @param {Function} handler 后备处理函数
         */
        exports.setBackup = function (handler) {
            this.backup = handler;
        };

        /**
         * 获取当前实例使用的{@link locator}对象
         *
         * @return {locator}
         * @protected
         */
        exports.getLocator = function () {
            return this.locator;
        };

        /**
         * 设置当前实例使用的{@link locator}对象
         *
         * 可以为任意对象，按{@link locator#event-redirect}实现此事件即可
         *
         * @param {locator} locator 关联的{@link locator}实例
         */
        exports.setLocator = function (locator) {
            this.locator = locator;
        };

        /**
         * 获取当前实例使用的事件总线
         *
         * @return {mini-event.EventTarget}
         * @protected
         */
        exports.getEventBus = function () {
            return this.eventBus;
        };

        /**
         * 设置当前实例使用的事件总线
         *
         * 事件总线可以是任何对象，只要实现`fire`方法供事件触发即可
         *
         * @param {mini-event.EventTarget} eventBus 事件总线对象
         */
        exports.setEventBus = function (eventBus) {
            this.eventBus = eventBus;
        };

        /**
         * 开始`router`对象的工作
         */
        exports.start = function () {
            this.getLocator().on('redirect', executeRoute, this);
        };

        var Router = require('eoo').create(require('mini-event/EventTarget'), exports);
        var instance = new Router();
        instance.setLocator(require('./locator'));
        instance.setEventBus(require('./events'));
        instance.Router = Router;
        return instance;
    }
);
