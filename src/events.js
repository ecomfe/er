/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 事件中心
 * @author otakustay
 */
define(
    function (require) {
        /**
         * @class events
         *
         * 事件中心，ER框架的所有全局事件均通过此对象暴露
         *
         * @mixins mini-event.EventTarget
         * @singleton
         */
        var events = {
            /**
             * 通知一个错误的产生
             *
             * @param {Mixed} error 错误对象，如果是字符串则会被封装为一个Error对象
             */
            notifyError: function (error) {
                if (typeof error === 'string') {
                    error = new Error(error);
                }

                this.fire('error', { error: error });

                return error;
            }
        };

        require('mini-event/EventTarget').enable(events);

        return events;

        /**
         * @event error
         * @member events
         * 
         * 接收到错误时触发
         *
         * @param {Mixed} error 抛出的错误对象
         */

        /**
         * @event forwardaction
         * @member events
         *
         * 在重定向前往一个Action时，但执行任何Action查找、进入等逻辑前触发
         *
         * @param {URL} url 当前访问的URL
         * @param {string} container 指定渲染Action的容器元素的id
         * @param {boolean} isChildAction 是否为子Action
         * @param {URL} [referrer] 来源URL
         */

        /**
         * @event actionmoved
         * @member events
         *
         * 发现一个Action通过{@link meta.ActionConfig#movedTo}配置为移动后触发
         *
         * @param {URL} url 当前访问的URL
         * @param {meta.ActionConfig} config 查找到的Action配置对象
         * @param {string} movedTo 移动的目标地址
         */

        /**
         * @event actionnotfound
         * @member events
         *
         * 发现一个Action通过{@link meta.ActionConfig#movedTo}配置为移动后触发
         *
         * 事件对象提供{@link meta.ActionContext}中的各属性
         *
         * @param {string} failType 失败类型，始终为`"NotFound"`
         * @param {string} reason 失败原因，始终为`"Not Found"`
         */

        /**
         * @event permissiondenied
         * @member events
         *
         * 发现访问一个没有权限的Action时触发
         *
         * 事件对象提供{@link meta.ActionContext}中的各属性
         *
         * @param {string} failType 失败类型，始终为`"PermissionDenied"`
         * @param {string} reason 失败原因，始终为`"Permission denied"`
         */

        /**
         * @event actionabort
         * @member events
         *
         * 发现访问一个没有权限的Action时触发
         *
         * 事件对象提供{@link meta.ActionContext}中的各属性
         */

        /**
         * @event actionfail
         * @member events
         *
         * 发现访问一个没有权限的Action时触发
         *
         * 事件对象提供{@link meta.ActionContext}中的各属性
         *
         * @param {string} failType 失败类型，可能有2个值：
         *
         * - `"NoModule"`：表示根据{@link meta.ActionConfig#type}加载不到对应的模块
         * - `"InvalidFactory"`：表示加载得到一个Action工厂但是无法用其生产Action实例
         *
         * @param {string} reason 失败原因
         * @param {meta.ActionConfig} config 当前Action的配置项
         * @param {Object} action 当`failType`为`"InvalidFactory"`时存在，
         * 值为当前加载的被认为是Action工厂的对象
         */

        /**
         * @event actionloaded
         * @member events
         *
         * 当Action模块加载完毕后触发
         *
         * @param {URL} url 当前访问的地址
         * @param {meta.ActionConfig} config 当前的Action配置项
         * @param {Function} action 当前的Action构造函数
         */

        /**
         * @event leaveaction
         * @member events
         *
         * 当离开一个Action时触发，触发后调用{@link Action#method-leave}方法
         *
         * @param {Action} action 当前的Action对象
         * @param {meta.ActionContext} to 离开后前往的下一个Action的上下文
         */

        /**
         * @event enteraction
         * @member events
         *
         * 在进入一个Action时触发，触发后调用{@link Action#method-enter}方法
         *
         * 事件对象提供{@link meta.ActionContext}中的各属性
         *
         * @param {Action} action 当前的Action对象
         */

        /**
         * @event enteractioncomplete
         * @member events
         *
         * 在一个Action完成进入，即{@link Action#method-enter}的生命周期完成之后触发
         *
         * 事件对象提供{@link meta.ActionContext}中的各属性
         *
         * @param {Action} action 当前的Action对象
         */

        /**
         * @event enteractionfail
         * @member events
         *
         * 在进入一个Action的过程中出现错误时触发
         *
         * 事件对象提供{@link meta.ActionContext}中的各属性
         *
         * @param {string} failType 失败类型，始终为`"EnterFail"`
         * @param {string} reasone 失败原因
         */
    }
);
