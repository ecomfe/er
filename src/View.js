/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file View类声明
 * @author otakustay
 */
define(
    function (require) {
        var EventTarget = require('mini-event/EventTarget');
        var util = require('./util');

        /**
         * View类声明
         * 
         * 在ER框架中，View不一定要继承该类，
         * 任何有一个名为`render`的方法的对象均可作为View
         * 
         * 该类结合`template`对象，实现了一个通用的RIA视图方案
         *
         * @constructor
         * @extends EventTarget
         */
        function View() {
        }

        /**
         * 对应的模板
         *
         */
        View.prototype.template = '';

        /**
         * 获取对应的模板名称
         *
         * @return {string}
         */
        View.prototype.getTemplateName = function () {
            return this.template || '';
        };

        /**
         * 对应的Model对象
         *
         * @type {Mixed}
         */
        View.prototype.model = null;

        /**
         * 渲染容器的元素或其id
         *
         * @type {string | HTMLElement}
         */
        View.prototype.container = '';

        /**
         * 获取渲染容器的元素
         *
         * @return {HTMLElement}
         */
        View.prototype.getContainerElement = function () {
            return util.getElement(this.container) || null;
        };

        /**
         * 渲染当前视图
         */
        View.prototype.render = function () {
            var model = this.model;
            if (model && typeof model.get !== 'function') {
                var Model = require('./Model');
                model = new Model(model);
            }

            var container = this.getContainerElement();
            // 容器没有还不一定是没配置好，很可能是主Action销毁了子Action才刚加载完
            if (!container) {
                var url = model && model.get('url');
                throw new Error(
                    'Container not found when rendering '
                    + (url ? '"' + url + '"' : 'view')
                );
            }

            var template = require('./template');
            template.merge(container, this.getTemplateName(), model);

            this.enterDocument();
        };


        /**
         * 当容器渲染完毕后触发，用于控制元素可见性及绑定事件等DOM操作
         *
         * @protected
         */
        View.prototype.enterDocument = require('./util').noop;

        /**
         * 销毁当前视图
         */
        View.prototype.dispose = function () {
            var container = this.getContainerElement();
            container && (container.innerHTML = '');
        };

        require('./util').inherits(View, EventTarget);
        return View;
    }
);
