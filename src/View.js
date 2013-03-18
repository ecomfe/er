/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file View类声明
 * @author otakustay
 */
define(
    function (require) {
        var Observable = require('./Observable');

        /**
         * View类声明
         * 
         * 在ER框架中，View不一定要继承该类，
         * 任何有一个名为`render`的方法的对象均可作为View
         * 
         * 该类结合`template`对象，实现了一个通用的RIA视图方案
         *
         * @constructor
         * @extends Observable
         */
        function View() {
        }

        /**
         * 对应的模板
         *
         * @type {string}
         * @public
         */
        View.prototype.template = '';

        /**
         * 对应的Model对象
         *
         * @type {*}
         * @public
         */
        View.prototype.model = null;

        /**
         * 渲染容器的元素的id
         *
         * @type {string}
         * @public
         */
        View.prototype.container = '';

        /**
         * 渲染当前视图
         *
         * @public
         */
        View.prototype.render = function () {
            var container = document.getElementById(this.container);
            var template = require('./template');
            var model = this.model;
            if (model && typeof model.get !== 'function') {
                var Model = require('./Model');
                model = new Model(model);
            }
            template.merge(container, this.template, model);

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
         *
         * @public
         */
        View.prototype.dispose = function () {
            var container = document.getElementById(this.container);
            container && (container.innerHTML = '');
        };

        require('./util').inherits(View, Observable);
        return View;
    }
);