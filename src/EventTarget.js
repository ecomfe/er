/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 兼容EventTarget模块
 * @author otakustay, errorrik
 */
define(
    function (require) {
        function interopDefault(exports) {
            return exports.__esModule ? exports.default : exports;
        }

        var EventTarget = interopDefault(require('mini-event/EventTarget'));

        return EventTarget;
    }
);
