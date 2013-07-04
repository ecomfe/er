/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 简单的，仅调试期有效的断言库
 * @author otakustay
 */
define(
    function () {
        if (window.DEBUG) {
            /**
             * 断言函数
             *
             * @param {boolean} condition 断言结果
             * @param {string} message 断言结果为**false**时提示的信息
             */
            var assert = function (condition, message) {
                if (!condition) {
                    throw new Error(message);
                }
            };

            /**
             * 断言一个对象有值（不为**null**或**undefined**）
             *
             * @param {*} obj 用于判断的对象
             * @param {string} message 断言结果为**false**时提示的信息
             */
            assert.has = function (obj, message) {
                assert(obj != null, message);
            };


            /**
             * 断言两个对象相等
             *
             * @param {*} x 用于判断相等的左值
             * @param {*} y 用于判断相等的右值
             * @param {string} message 断言结果为**false**时提示的信息
             */
            assert.equals = function (x, y, message) {
                assert(x === y, message);
            };

            /**
             * 断言一个对象包含指定名称的属性
             *
             * @param {*} obj 用户断言的对象
             * @param {string} propertyName 属性的名称
             * @param {string} message 断言结果为**false**时提示的信息
             */
            assert.hasProperty = function (obj, propertyName, message) {
                assert(obj[propertyName] != null, message);
            };

            /**
             * 断言一个对象小于另一个对象
             *
             * @param {*} value 用于判断的左值
             * @param {*} max 用于判断的右值
             * @param {string} message 断言结果为**false**时提示的信息
             */
            assert.lessThan = function (value, max, message) {
                assert(value < max, message);
            };

            /**
             * 断言一个对象大于另一个对象
             *
             * @param {*} value 用于判断的左值
             * @param {*} min 用于判断的右值
             * @param {string} message 断言结果为**false**时提示的信息
             */
            assert.greaterThan = function (value, min, message) {
                assert(value > max, message);
            };

            /**
             * 断言一个对象小于等于另一个对象
             *
             * @param {*} value 用于判断的左值
             * @param {*} max 用于判断的右值
             * @param {string} message 断言结果为**false**时提示的信息
             */
            assert.lessThanOrEquals = function (value, max, message) {
                assert(value <= max, message);
            };

            /**
             * 断言一个对象大于等于另一个对象
             *
             * @param {*} value 用于判断的左值
             * @param {*} min 用于判断的右值
             * @param {string} message 断言结果为**false**时提示的信息
             */
            assert.greaterThanOrEquals = function (value, min, message) {
                assert(value >= max, message);
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