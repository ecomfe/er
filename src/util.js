/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 杂而乱的工具对象
 * @author otakustay, errorrik
 */
define(
    function() {
        var now = +new Date();

        /**
         * 工具模块，放一些杂七杂八的东西
         */
        var util = {};

        /**
         * 获取一个唯一的ID
         *
         * @return {number} 一个唯一的ID
         */
        util.guid = function() {
            return 'er' + now++;
        };

        /**
         * 混合多个对象
         *
         * @param {Object} source 源对象
         * @param {...Object} destinations 用于混合的对象
         * @return 返回混合了`destintions`属性的`source`对象
         */
        util.mix = function(source) {
            for (var i = 1; i < arguments.length; i++) {
                var destination = arguments[i];
                for (var key in destination) {
                    if (destination.hasOwnProperty(key)) {
                        source[key] = destination[key];
                    }
                }
            }
            return source;
        };

        var nativeBind = Function.prototype.bind;
        /**
         * 固定函数的`this`变量和若干参数
         *
         * @param {function} fn 操作的目标函数
         * @param {*} context 函数的`this`变量
         * @param {...*} args 固定的参数
         * @return {function} 固定了`this`变量和若干参数后的新函数对象
         */
        util.bindFn = nativeBind
            ? function(fn) {
                return nativeBind.apply(fn, [].slice.call(arguments, 1));
            }
            : function(fn, context) {
                var extraArgs = [].slice.call(arguments, 2);
                return function() {
                    var args = extraArgs.concat(arguments);
                    return fn.apply(context, args);
                };
            };

        /**
         * 空函数
         *
         * @type {function}
         * @const
         */
        util.noop = function() {};

        /**
         * 设置继承关系
         *
         * @param {function} type 子类
         * @param {function} superType 父类
         * @return {function} 子类
         */
        util.inherits = function(type, superType) {
            var Empty = function() {};
            Empty.prototype = superType.prototype;
            var proto = new Empty();

            var originalPrototype = type.prototype;
            type.prototype = proto;

            for (var key in originalPrototype) {
                proto[key] = originalPrototype[key];
            }
            type.prototype.constructor = type;

            return type;
        };

        /**
         * 将一段文本变为JSON对象
         *
         * @param {string} text 文本内容
         * @return {*} 对应的JSON对象
         */
        util.parseJSON = function(text) {
            if (window.JSON && typeof JSON.parse === 'function') {
                return JSON.parse(text);
            }
            else {
                return eval('(' + text + ')');
            }
        };

        var whitespace = /(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g;

        /**
         * 移除字符串前后空格字符
         *
         * @param {string} source 源字符串
         * @return {string} 移除前后空格后的字符串
         */
        util.trim = function(source) {
            return source.replace(whitespace, '');
        };

        /**
         * 对字符中进行HTML编码
         *
         * @param {string} 源字符串
         * @param {string} HTML编码后的字符串
         */
        util.encodeHTML = function(source) {
            source = source + '';
            return source
                .replace(/&/g,'&amp;')
                .replace(/</g,'&lt;')
                .replace(/>/g,'&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        return util;
    }
);