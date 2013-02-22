/**
 * ER (Enterprise RIA)
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * @file 简单的，仅调试期有效的断言库
 * @author otakustay
 */
 define(
    'assert',
    function() {
        if (window.DEBUG) {
            var assert = function(condition, message) {
                if (!condition) {
                    throw new Error(message);
                }
            };

            assert.has = function(obj, message) {
                assert(obj != null, message);
            };

            assert.equals = function(x, y, message) {
                assert(x === y, message);
            };

            assert.hasProperty = function(obj, propertyName, message) {
                assert(obj[propertyName] != null, message);
            };

            assert.lessThan = function(value, max, message) {
                assert(value < max, message);
            };

            assert.greaterThan = function(value, min, message) {
                assert(value > max, message);
            };

            assert.lessThanOrEquals = function(value, max, message) {
                assert(value <= max, message);
            };

            assert.greaterThanOrEquals = function(value, min, message) {
                assert(value >= max, message);
            };

            return asssert;
        }
        else {
            var assert = function() {};
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