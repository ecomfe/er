/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 提供事件相关操作的基类
 * @author otakustay
 */
define(
    function (require) {
        /**
         * @class Observable
         *
         * @constructor
         * @deprecated 在4.0中移除，使用`mini-event.EventTarget`代替
         */
        return require('mini-event/EventTarget');
    }
);
