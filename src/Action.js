/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Action类
 * @author otakustay
 */
define(
    function (require) {
        var util = require('./util');

        /**
         * 收集Model加载时产生的错误并通知到Action
         *
         * @param {Action} this 当前Action实例
         * @param {Object...} results 模块加载的结果集
         * @return {Mixed} 错误处理结果
         * @ignore
         */
        function reportErrors() {
            var errors = [];
            for (var i = 0; i < arguments.length; i++) {
                var result = arguments[i];
                if (!result.success) {
                    errors.push(result);
                }
            }

            return this.handleError(errors);
        }

        /**
         * @class Action
         *
         * Action类
         *
         * 在ER框架中，Action并不一定要继承该类，
         * 任何有一个名为`enter`的方法的对象均可作为Action
         *
         * 该类制定了一个完整的Action的执行周期
         *
         * @extends mini-event.EventTarget
         * @constructor
         */
        var exports = {};

        exports.constructor = function () {
            this.disposed = false;

            this.initialize();
        };

        exports.initialize = util.noop;

        /**
         * 当前Action运行上下文
         *
         * @type {meta.ActionContext}
         * @protected
         */
        exports.context = null;

        /**
         * 指定对应的Model类型，{@link Action#createModel}默认使用此属性
         *
         * @type {Function}
         * @protected
         */
        exports.modelType = null;

        /**
         * 指定对应的View类型，{@link Action#createView}默认使用此属性
         *
         * @type {Function}
         * @protected
         */
        exports.viewType = null;

        /**
         * 进入Action执行周期
         *
         * @param {meta.ActionContext} actionContext 进入Action的上下文
         * @return {meta.Promise}
         * @fires enter
         * @fires beforemodelload
         */
        exports.enter = function (actionContext) {
            this.context = actionContext || {};

            /**
             * @event enter
             *
             * Action生命周期开始执行时触发
             */
            this.fire('enter');

            // `actionContext.args`里有URL里的参数和子Action时传入的`options`，全部放到`Model`上去
            var args = util.mix({}, actionContext && actionContext.args);

            if (this.model) {
                this.model.fill(args);
            }
            else {
                this.model = this.createModel(args);
            }

            /**
             * @event beforemodelload
             *
             * `Model`已经创建完毕，开始进行数据加载前触发
             */
            this.fire('beforemodelload');

            if (this.model && typeof this.model.load === 'function') {
                var loadingModel = this.model.load();
                return loadingModel.then(
                    util.bind(this.forwardToView, this),
                    util.bind(reportErrors, this)
                );
            }
            else {
                this.forwardToView();
                return require('./Deferred').resolved(this);
            }
        };

        /**
         * 处理Model加载产生的错误
         *
         * 当Model加载失败后，Action会收集所有的错误，组装为一个数组后调用本方法
         *
         * - 如果该方法正常返回，则认为错误已经处理完毕，继续进入下一步
         * - 如果该方法抛出异常，则认为错误未处理，中断执行流程
         *
         * @param {Object[]} errors 错误集合
         * @ignore
         */
        exports.handleError = function (errors) {
            throw errors;
        };

        /**
         * 创建对应的Model对象
         *
         * @param {meta.ActionContext} context 进入Action的上下文
         * @return {Model | Object} 当前Action需要使用的Model对象
         * @protected
         */
        exports.createModel = function (context) {
            if (this.modelType) {
                var model = new this.modelType(context);
                return model;
            }
            else {
                return {};
            }
        };

        /**
         * 加载完Model后，进入View相关的逻辑
         *
         * @protected
         * @fires modelloaded
         * @fires beforerender
         * @fires rendered
         * @fires entercomplete
         */
        exports.forwardToView = function () {
            // 如果已经销毁了就别再继续下去
            if (this.disposed) {
                return this;
            }

            /**
             * @event modelloaded
             *
             * Model加载完成时触发
             */
            this.fire('modelloaded');

            if (!this.view) {
                this.view = this.createView();
            }

            if (this.view) {
                this.view.model = this.model;
                // 如果创建View的时候已经设置了`container`，就不要强行干扰了
                if (!this.view.container) {
                    this.view.container = this.context.container;
                }

                /**
                 * @event beforerender
                 *
                 * 视图开始渲染时触发
                 */
                this.fire('beforerender');

                this.view.render();

                /**
                 * @event rendered
                 *
                 * 视图渲染完毕后触发
                 */
                this.fire('rendered');

                this.initBehavior();

                /**
                 * @event entercomplete
                 *
                 * Action进入完毕后触发
                 */
                this.fire('entercomplete');
            }
            else {
                var events = require('./events');
                events.notifyError('No view attached to this action');
            }

            return this;
        };

        /**
         * 创建对应的View对象
         *
         * @return {Object} 当前Action需要使用的View对象
         */
        exports.createView = function () {
            return this.viewType ? new this.viewType() : null;
        };

        /**
         * 处理与View相关的交互逻辑
         *
         * @protected
         */
        exports.initBehavior = util.noop;

        /**
         * 过滤重定向操作，本方法返回`false`则会取消重定向，由当前Action处理新的URL
         *
         * @param {URL} targetURL 重定向的目标URL
         * @return {boolean}
         */
        exports.filterRedirect = util.noop;

        /**
         * 离开当前Action，清理Model和View
         *
         * @protected
         * @fires beforeleave
         * @fires leave
         */
        exports.leave = function () {
            // 如果已经销毁了就别再继续下去
            if (this.disposed) {
                return this;
            }

            this.disposed = true;

            /**
             * @event beforeleave
             *
             * 准备离开Action时触发
             */
            this.fire('beforeleave');

            if (this.model) {
                if (typeof this.model.dispose === 'function') {
                    this.model.dispose();
                }
                this.model = null;
            }

            if (this.view) {
                if (typeof this.view.dispose === 'function') {
                    this.view.dispose();
                }
                this.view = null;
            }

            /**
             * @event leave
             *
             * 离开Action后触发
             */
            this.fire('leave');

            this.destroyEvents();
        };

        /**
         * 重定向到另一个URL
         *
         * 通常会使用{@link locator#method-redirect}来重定向，
         * 但{@link locator}对象存在一些问题：
         *
         * - 严重依赖浏览器实现，因此无法在脱离浏览器的环境下做单元测试
         * - 无法应对子Action的跳转场景
         *
         * 因此由Action直接提供一个`redirect`方法来实现跳转功能，方便替换和扩展
         *
         * @param {string | URL} url 需要重定向的目标URL
         * @param {meta.RedirectOption} [options] 额外附加的参数对象
         */
        exports.redirect = function (url, options) {
            var locator = require('./locator');
            locator.redirect(url, options);
        };

        /**
         * 重加载当前Action
         */
        exports.reload = function () {
            var locator = require('./locator');
            locator.reload();
        };

        /**
         * 返回来源URL，无来源URL时可指定一个默认地址
         *
         * @param {string | URL} [defaultURL] 无来源URL时的跳转地址，
         * 如果无此参数，则无来源URL时不进行跳转
         */
        exports.back = function (defaultURL) {
            var referrer = this.context && this.context.referrer;
            var url = referrer || defaultURL;
            if (url) {
                this.redirect(url);
            }
        };

        var Action = require('eoo').create(require('mini-event/EventTarget'), exports);
        return Action;
    }
);
