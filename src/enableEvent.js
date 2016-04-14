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

        /**
         * 让一个对象拥有`mini-event.EventTarget`的功能
         *
         * @param {Object} target 需要启用事件功能的对象
         */
        return function enableEvent(target) {
            target.miniEventPool = {};
            // 如果`mini-event`是使用ES6写的话，原型上的内容是不可遍历的，因此不能用`util.mix`，这里写死所有方法
            target.on = EventTarget.prototype.on;
            target.once = EventTarget.prototype.once;
            target.un = EventTarget.prototype.un;
            target.fire = EventTarget.prototype.fire;
            target.destroyEvents = EventTarget.prototype.destroyEvents;
        };
    }
);
