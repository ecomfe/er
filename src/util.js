/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 杂而乱的工具对象
 * @author otakustay, errorrik
 */
define(
    function () {
        var now = +new Date();

        /**
         * @class util
         *
         * 工具模块，放一些杂七杂八的东西
         *
         * @singleton
         */
        var util = {};

        /**
         * 获取一个唯一的ID
         *
         * @return {string} 一个唯一的ID
         */
        util.guid = function () {
            return 'er' + now++;
        };

        /**
         * 混合多个对象
         *
         * @param {Object} source 源对象
         * @param {Object...} destinations 用于混合的对象
         * @return 返回混合了`destintions`属性的`source`对象
         */
        util.mix = function (source) {
            for (var i = 1; i < arguments.length; i++) {
                var destination = arguments[i];

                // 就怕有人传**null**之类的进来
                if (!destination) {
                    continue;
                }

                // 这里如果`destination`是字符串的话，会遍历出下标索引来，
                // 认为这是调用者希望的效果，所以不作处理
                for (var key in destination) {
                    if (destination.hasOwnProperty(key)) {
                        source[key] = destination[key];
                    }
                }
            }
            return source;
        };

        // `bind`的实现特别使用引擎原生的，
        // 因为自己实现的`bind`很会影响调试时的单步调试，
        // 跳进一个函数的时候还要经过这个`bind`几步很烦，原生的就不会
        var nativeBind = Function.prototype.bind;
        /**
         * 固定函数的`this`变量和若干参数
         *
         * @param {Function} fn 操作的目标函数
         * @param {Mixed} context 函数的`this`变量
         * @param {Mixed...} args 固定的参数
         * @return {Function} 固定了`this`变量和若干参数后的新函数对象
         */
        util.bind = nativeBind
            ? function (fn) {
                return nativeBind.apply(fn, [].slice.call(arguments, 1));
            }
            : function (fn, context) {
                var extraArgs = [].slice.call(arguments, 2);
                return function () {
                    var args = extraArgs.concat([].slice.call(arguments));
                    return fn.apply(context, args);
                };
            };

        /**
         * 空函数
         *
         * @property
         * @type {Function}
         */
        util.noop = function () {};

        var dontEnumBug = !(({ toString: 1 }).propertyIsEnumerable('toString'));

        /**
         * 设置继承关系
         *
         * @param {Function} type 子类
         * @param {Function} superType 父类
         * @return {Function} 子类
         */
        util.inherits = function (type, superType) {
            var Empty = function () {};
            Empty.prototype = superType.prototype;
            var proto = new Empty();

            var originalPrototype = type.prototype;
            type.prototype = proto;

            for (var key in originalPrototype) {
                proto[key] = originalPrototype[key];
            }
            if (dontEnumBug) {
                // 其实还有好多其它的，但应该不会撞上吧(╯‵□′)╯︵┻━┻
                if (originalPrototype.hasOwnProperty('toString')) {
                    proto.toString = originalPrototype.toString;
                }
                if (originalPrototype.hasOwnProperty('valueOf')) {
                    proto.valueOf = originalPrototype.valueOf;
                }
            }
            type.prototype.constructor = type;

            return type;
        };

        /**
         * 将一段文本变为JSON对象
         *
         * @param {string} text 文本内容
         * @return {Mixed} 对应的JSON对象
         */
        util.parseJSON = function (text) {
            if (!text) {
                return undefined;
            }

            if (window.JSON && typeof JSON.parse === 'function') {
                return JSON.parse(text);
            }
            else {
                /* jshint evil: true */
                return new Function('return (' + text + ');')();
            }
        };

        var whitespace = /(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g;

        /**
         * 移除字符串前后空格字符
         *
         * @param {string} source 源字符串
         * @return {string} 移除前后空格后的字符串
         */
        util.trim = function (source) {
            return source.replace(whitespace, '');
        };

        /**
         * 对字符中进行HTML编码
         *
         * @param {string} source 源字符串
         * @param {string} HTML编码后的字符串
         */
        util.encodeHTML = function (source) {
            source = source + '';
            return source
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        /**
         * 兼容性获取一个元素
         *
         * @param {HTMLElement | string} element 元素或元素的id
         * @return {HTMLElement}
         */
        util.getElement = function (element) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            return element;
        };

        return util;
    }
);
