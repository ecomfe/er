/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 获取数据相关的函数生产工厂
 * @author otakustay
 */
define(
    function (require) {
        /**
         * 获取数据相关的函数生产工厂
         * 
         * 该对象下的每个方法均返回一个函数，可用于`Model`的`datasource`配置
         */
        var datasource = {};

        /**
         * 获取一个常量
         *
         * @param {*} value 常量的值
         * @return {function} 数据获取函数
         */
        datasource.constant = function (value) {
            return function () {
                return value;
            };
        };

        /**
         * 加载远程数据
         *
         * @param {string} url 加载的URL
         * @param {Object=} options 调用`ajax.request`时的其它配置项
         * @return {function} 数据获取函数
         */
        datasource.remote = function (url, options) {
            return function () {
                options = require('./util').mix(
                    { url: url, dataType: 'json' }, 
                    options
                );
                var ajax = require('./ajax');
                return ajax.request(options);
            };
        };

        /**
         * 获取权限数据
         *
         * @param {string} name 权限的名称
         * @return {function} 数据获取函数
         */
        datasource.permission = function (name) {
            return function () {
                var permission = require('./permission');
                return permission.isAllow(name);
            };
        };

        return datasource;
    }
);