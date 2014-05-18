/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 获取数据相关的函数生产工厂
 * @author otakustay
 */
define(
    function (require) {
        /**
         * @class datasource
         *
         * 获取数据相关的函数生产工厂
         *
         * 该对象下的每个方法均返回一个函数，可用于生成{@link Model#datasource}配置
         *
         * @singleton
         */
        var datasource = {};

        /**
         * 获取一个常量
         *
         * @param {Mixed} value 常量的值
         * @return {Function} 数据获取函数
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
         * @param {Object} [options] 调用{@link Ajax#request}时的其它配置项
         * @return {Function} 数据获取函数
         */
        datasource.remote = function (url, options) {
            return function (model) {
                options = require('./util').mix(
                    { url: url, dataType: 'json' },
                    options
                );

                // 允许使用函数返回请求时的参数
                if (typeof options.data === 'function') {
                    options.data = options.data(model);
                }
                var ajax = require('./ajax');
                return ajax.request(options);
            };
        };

        /**
         * 获取权限数据
         *
         * @param {string} name 权限的名称
         * @return {Function} 数据获取函数
         */
        datasource.permission = function (name) {
            return function () {
                var permission = require('./permission');
                return permission.isAllow(name);
            };
        };

        /**
         * 当属性为`null`或`undefined`时，使用默认值代替
         *
         * @param {Mixed} defaultValue 用于代替的默认值
         * @param {string} [name] 判断的属性名，默认与当前获取的属性名相同
         * @return {Function} 数据获取函数
         */
        datasource.defaultValue = function (defaultValue, name) {
            return function (model, options) {
                if (!options.name && !name) {
                    throw new Error('No property name specified to determine whether value exists in this model');
                }

                var propertyName = name || options.name;
                return model.hasValue(propertyName)
                    ? model.get(propertyName)
                    : defaultValue;
            };
        };

        /**
         * 转换属性类型
         *
         * @param {string} type 转换的目标类型，支
         * 持`"number"`、`"string"`或`"boolean"`
         * @param {string} [name] 指定属性名，默认与当前获取的属性名相同
         * @return {Function} 数据获取函数
         */
        datasource.convertTo = function (type, name) {
            return function (model, options) {
                if (!options.name && !name) {
                    throw new Error('No property name specified to convert');
                }

                var property = name || options.name;
                var value = model.get(property);

                switch (type) {
                    case 'number':
                        return parseInt(value, 10);
                    case 'string':
                        return value + '';
                    case 'boolean':
                        return !!value;
                    default:
                        return value;
                }
            };
        };

        return datasource;
    }
);
