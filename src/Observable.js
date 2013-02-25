/**
 * ER (Enterprise RIA)
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * @file 提供事件相关操作的基类
 * @author otakustay
 */
define(
    'Observable',
    function() {
        /**
         * 提供与事件相关的操作的基类
         */
        var Observable = function() {
            this._events = {};
        };

        /**
         * 注册一个事件处理函数
         *
         * @param {string} type 事件的类型，如果类型为`*`则在所有事件触发时执行
         * @param {function} handler 事件的处理函数
         */
        Observable.prototype.on = function(type, handler) {
            var pool = this._events[type];
            if (!pool) {
                pool = this._events[type] = [];
            }
            // TODO: 是否需要去重，在此处去重会和`*`的事件在fire时冲突
            pool.push(handler);
        };

        /**
         * 注销一个事件处理函数
         * @param {string} type 事件的类型，
         *     如果值为`*`仅会注销通过`*`为类型注册的事件，
         *     并不会将所有事件注销
         * @param {function=} handler 事件的处理函数，
         *     无此参数则注销`type`指定类型的所有事件处理函数
         */
        Observable.prototype.un = function(type, handler) {
            if (!handler) {
                this._events[type] = [];
                return;
            }

            var pool = this._events[type];
            if (pool) {
                for (var i = 0; i < pool.length; i++) {
                    if (pool[i] === handler) {
                        pool.splice(i, 1);
                        // 考虑到没有去重的情况下可能有多个相同的handler，
                        // 因此继续循环，不作退出处理
                        i--;
                    }
                }
            }
        };

        /**
         * 触发指定类型的事件
         * 
         * 事件处理函数的执行顺序如下：
         * 
         * 1. 如果对象上存在名称为`on{type}`的方法，执行该方法
         * 2. 按照事件注册时的先后顺序，依次执行类型为`type`的处理函数
         * 3. 按照事件注册时的先后顺序，依次执行类型为`*`的处理函数
         *
         * @param {string} 事件类型
         * @param {Object} 事件对象
         */
        Observable.prototype.fire = function(type, event) {
            event = event || {};
            event.type = type;

            var inlineHandler = this['on' + type];
            if (typeof inlineHandler === 'function') {
                inlineHandler.apply(this, args);
            }

            var pool = this._events[type];
            if (!pool) {
                return;
            }
            for (var i = 0; i < pool.length; i++) {
                var handler = pool[i];
                handler.call(this, event);
            }

            // 类型为`*`的事件在所有事件触发时都要触发
            if (type !== '*') {
                var allPool = this._events['*'];
                if (!allPool) {
                    return;
                }

                for (var i = 0; i < allPool.length; i++) {
                    var handler = allPool[i];
                    handler.call(this, event);
                }
            }
        };

        /**
         * 在无继承关系的情况下，使一个对象拥有事件处理的功能
         * 
         * @param {Any} target 需要支持事件处理功能的对象
         */
        Observable.enable = function(target) {
            target._events = [];
            target.on = Observable.prototype.on;
            target.un = Observable.prototype.un;
            target.fire = Observable.prototype.fire;
        };

        return Observable;
    }
);