/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 简单的，仅调试期有效的断言库
 * @author otakustay
 */
define(
    function () {
        if (window.DEBUG) {
            /**
             * @class assert
             *
             * 断言函数
             *
             * 断言函数仅在开发期有效，当`window.DEBUG`属性为`true`时，
             * 断言失败会抛出异常，其它情况下断言无任何作用
             *
             * 断言是[契约式编程](http://en.wikipedia.org/wiki/Design_by_contract)
             * 中很重要的一块，使用得当可以有效地提高程序的质量，因此ER提供了此功能
             *
             * @param {boolean} condition 断言结果
             * @param {string} message 断言结果为`false`时提示的信息
             * @singleton
             */
            var assert = function (condition, message) {
                if (!condition) {
                    throw new Error(message);
                }
            };

            /**
             * 断言一个对象有值（不为`null`或`undefined`）
             *
             * @param {Mixed} obj 用于判断的对象
             * @param {string} message 断言结果为`false`时提示的信息
             * @member assert
             */
            assert.has = function (obj, message) {
                assert(obj != null, message);
            };


            /**
             * 断言两个对象相等
             *
             * @param {Mixed} x 用于判断相等的左值
             * @param {Mixed} y 用于判断相等的右值
             * @param {string} message 断言结果为`false`时提示的信息
             * @member assert
             */
            assert.equals = function (x, y, message) {
                assert(x === y, message);
            };

            /**
             * 断言一个对象包含指定名称的属性
             *
             * @param {Mixed} obj 用户断言的对象
             * @param {string} propertyName 属性的名称
             * @param {string} message 断言结果为`false`时提示的信息
             * @member assert
             */
            assert.hasProperty = function (obj, propertyName, message) {
                assert(obj[propertyName] != null, message);
            };

            /**
             * 断言一个对象小于另一个对象
             *
             * @param {Mixed} value 用于判断的左值
             * @param {Mixed} max 用于判断的右值
             * @param {string} message 断言结果为`false`时提示的信息
             * @member assert
             */
            assert.lessThan = function (value, max, message) {
                assert(value < max, message);
            };

            /**
             * 断言一个对象大于另一个对象
             *
             * @param {Mixed} value 用于判断的左值
             * @param {Mixed} min 用于判断的右值
             * @param {string} message 断言结果为`false`时提示的信息
             * @member assert
             */
            assert.greaterThan = function (value, min, message) {
                assert(value > min, message);
            };

            /**
             * 断言一个对象小于等于另一个对象
             *
             * @param {Mixed} value 用于判断的左值
             * @param {Mixed} max 用于判断的右值
             * @param {string} message 断言结果为`false`时提示的信息
             * @member assert
             */
            assert.lessThanOrEquals = function (value, max, message) {
                assert(value <= max, message);
            };

            /**
             * 断言一个对象大于等于另一个对象
             *
             * @param {Mixed} value 用于判断的左值
             * @param {Mixed} min 用于判断的右值
             * @param {string} message 断言结果为`false`时提示的信息
             * @member assert
             */
            assert.greaterThanOrEquals = function (value, min, message) {
                assert(value >= min, message);
            };

            return assert;
        }
        else {
            var assert = function () {};
            assert.has = assert;
            assert.equals = assert;
            assert.hasProperty = assert;
            assert.lessThan = assert;
            assert.greaterThan = assert;
            assert.lessThanOrEquals = assert;
            assert.greaterThanOrEquals = assert;
            return assert;
        }
    }
);
