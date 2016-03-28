/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 对静态对象启用事件功能
 * @author otakustay, errorrik
 */
define(
    function (require) {
        function interopDefault(exports) {
            return exports.__esModule ? exports.default : exports;
        }

        var EventTarget = interopDefault(require('mini-event/EventTarget'));
        var util = require('./util');

        /**
         * 让一个对象拥有`mini-event.EventTarget`的功能
         *
         * @param {Object} target 需要启用事件功能的对象
         */
        return function enableEvent(target) {
            target.miniEventPool = {};
            util.mix(target, EventTarget.prototype);
        };
    }
);
