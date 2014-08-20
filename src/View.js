/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 视图类
 * @author otakustay
 */
define(
    function (require) {
        var util = require('./util');

        /**
         * @class View
         *
         * 视图类
         *
         * 在ER框架中，View不一定要继承该类，
         * 任何有一个名为`render`的方法的对象均可作为View
         *
         * 该类结合`template`对象，实现了一个通用的RIA视图方案
         *
         * @extends mini-event.EventTarget
         * @constructor
         */
        var exports = {};

        exports.constructor = function () {
            this.initialize();
        };

        exports.initialize = util.noop;

        /**
         * 对应的模板名，指定一个etpl的`target`来作为渲染的内容，
         * 具体参考[etpl的说明](https://github.com/ecomfe/etpl#target)
         */
        exports.template = '';

        /**
         * 获取对应的模板名称，默认直接返回{@link View#template}属性
         *
         * @return {string}
         */
        exports.getTemplateName = function () {
            return this.template || '';
        };

        /**
         * 对应的{@link Model}对象，通常由{@link Action}设置
         *
         * @type {Mixed}
         * @readonly
         */
        exports.model = null;

        /**
         * 渲染容器的元素或其id，通常由{@link Action}设置
         *
         * @type {string | HTMLElement}
         * @readonly
         */
        exports.container = '';

        /**
         * 获取渲染容器的元素，默认返回{@link View#container}指定的元素
         *
         * @return {HTMLElement}
         */
        exports.getContainerElement = function () {
            return util.getElement(this.container) || null;
        };

        /**
         * 获取用于模板渲染的数据对象
         *
         * @return {Object}
         */
        exports.getTemplateData = function () {
            var model = this.model;
            if (model && typeof model.get !== 'function') {
                var Model = require('./Model');
                model = new Model(model);
            }

            var visit = function (propertyPath) {
                var path = propertyPath.replace(/\[(\d+)\]/g, '.$1').split('.');
                var propertyName = path.shift();
                var value = model.get(propertyName);

                while (value && (propertyName = path.shift())) {
                    value = value[propertyName];
                }

                return value;
            };

            return { get: visit, relatedModel: model };
        };

        /**
         * 渲染当前视图
         *
         * ER的默认实现是使用[etpl](https://github.com/ecomfe/etpl)渲染容器，
         * 如果需要使用其它的模板，或自己有视图的管理，建议重写此方法
         */
        exports.render = function () {
            var container = this.getContainerElement();
            // 容器没有还不一定是没配置好，很可能是主Action销毁了子Action才刚加载完
            if (!container) {
                var url = this.model
                    && typeof this.model.get === 'function'
                    && this.model.get('url');
                throw new Error('Container not found when rendering ' + (url ? '"' + url + '"' : 'view'));
            }

            var template = require('etpl');
            var html = template.render(this.getTemplateName(), this.getTemplateData());
            container.innerHTML = html;

            this.enterDocument();
        };


        /**
         * 当容器渲染完毕后触发，用于控制元素可见性及绑定事件等DOM操作
         *
         * @protected
         */
        exports.enterDocument = require('./util').noop;

        /**
         * 销毁当前视图
         */
        exports.dispose = function () {
            var container = this.getContainerElement();
            container && (container.innerHTML = '');
        };

        var View = require('eoo').create(require('mini-event/EventTarget'), exports);
        return View;
    }
);
