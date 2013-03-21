/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控制器实现
 * @author otakustay, erik
 */
define(
    function (require) {
        var actionPathMapping = {}; // 用于根据URL找Action配置
        var actionTypeMapping = {}; // 用户根据Action类型生成URL
        var currentURL = null;
        var currentAction = null;

        var Deferred = require('./Deferred');
        var URL = require('./URL');
        var config = require('./config');
        var assert = require('./assert');

        /**
         * 检查是否拥有权限
         * 
         * - 权限可以是一个数组，此时用户拥有数组中任意一项权限即认为有权限
         * - 权限也可以是个字符串，将各权限通过**|**字符分割
         *
         * @param {Array.<string> | string} authority 权限配置
         */
        function checkAuthority(authority) {
            if (!authority) {
                return true;
            }

            if (typeof authority === 'string') {
                authority = authority.split('|');
            }

            var permission = require('./permission');
            for (var i = 0; i < authority.length; i++) {
                if (permission.isAllow(authority[i])) {
                    return true;
                }
            }

            return false;
        }

        /**
         * 根据URL加载对应的Action对象
         *
         * @param {Object} args 调用Action的初始化参数
         * @return {Promise} 如果有相应的Action配置，返回一个Promise对象，
         * 如果正确创建了Action对象，则该Promise对象进入**resolved**状态，
         * 如果没找到Action的配置或者加载Action失败，则进入**rejected**状态
         */
        function loadAction(args) {
            var path = args.url.getPath();
            var actionConfig = actionPathMapping[path];
            var events = require('./events');

            events.fire('loadaction', { url: args.url });

            // 关于actionConfig配置项：
            // 
            // - `{string} type`：指定对应Action的模块id
            // - `{Array<string>|string} authority`：权限配置，
            //     参考`checkAuthority`函数中的说明
            // - `{string} noAuthorityLocation`：用户没有权限时的跳转URL
            // - `{string} movedTo`：表示该Action已经被移动到另一个路径，
            //     controller将根据该配置指定的路径加载对应的Action

            // 以下所有和跳转相关的逻辑均不能用`redirect`，
            // 因为一但有重定向，会在历史记录里多一帧，
            // 此后使用浏览器的后退功能，又会进入重定向逻辑，变成死循环
            // 因此在此处保持路径不变，但加载另一个Action

            // 同时，和跳转相关的逻辑均不能调用`forward`函数，
            // 一但调用`forward`函数，`currentURL`和`referrer`都会变化，
            // 这并不是希望实现的逻辑

            // 如果没有Action的配置，则跳转到404页面
            if (!actionConfig) {
                events.fire('actionnotfound', { url: args.url });

                args.url = URL.parse(config.notFoundLocation);

                // 对于404页面，是一切未找到的URL最终归宿，
                // 因此如果404对应的Action没有配置，会进入死循环，
                // 需要对这个配置进行特殊处理，如果没有404对应的Action，
                // 就返回null
                if (!actionPathMapping[args.url.getPath()]) {
                    return Deferred.rejected(
                        'no action configured for url ' + args.url.getPath());
                }

                return loadAction(args);
            }

            // 检查权限，如果没有权限的话，根据Action或全局配置跳转
            var hasAuthority = checkAuthority(actionConfig.authority);
            if (!hasAuthority) {
                events.fire(
                    'permissiondenied', 
                    { url: args.url, config: actionConfig }
                );

                var location = actionConfig.noAuthorityLocation 
                    || config.noAuthorityLocation;
                args.url = URL.parse(location);
                return loadAction(args);
            }

            // 检查Action的跳转，类似302跳转，用于系统升级迁移
            if (actionConfig.movedTo) {
                events.fire(
                    'actionmoved', 
                    {
                        url: args.url, 
                        config: actionConfig, 
                        movedTo: actionConfig.movedTo
                    }
                );

                var forwardURL = URL.parse(actionConfig.movedTo);
                args.url = forwardURL;
                return loadAction(args);
            }

            var loading = new Deferred();
            // local require有可能不支持`callback`参数，
            // 这里强制使用global require
            window.require(
                [actionConfig.type],
                function (SpecificAction) {
                    // 未防止在加载Action模块的时候，用户的操作导致进入其它模块，
                    // 这里需要判断当前的URL是否依旧是加载时指定的URL。
                    // 如果URL发生了变化，则应当不对Action模块作实例化处理。
                    // 
                    // 对于ActionA -> ActionB -> ActionA这样的情况，
                    // 由于这里的URL是个对象，引用变化判等失败，
                    // 因此不用担心ActionA被初始化2次的情况出现
                    if (args.url !== currentURL) {
                        return;
                    }

                    // 没有Action配置的`type`属性对应的模块实现
                    if (!SpecificAction) {
                        var reason = 
                            'No action implement for ' + actionConfig.type;

                        events.fire(
                            'actionfail',
                            {
                                url: args.url,
                                config: actionConfig,
                                reason: reason
                            }
                        );

                        loading.reject(reason);
                        return;
                    }

                    // 如果是个函数，则认为是Action的构造函数
                    if (typeof SpecificAction === 'function') {
                        loading.resolve(new SpecificAction(), args);
                        return;
                    }

                    // 此时`SpecificAction`是一个对象，
                    // 有可能是Action工厂或直接是Action对象
                    var action = SpecificAction;
                    // 处理Action工厂，
                    // Action工厂是一个对象，它能生产出一个Action对象，
                    // 有`createRuntimeAction`方法的对象即为Action工厂
                    if (typeof action.createRuntimeAction === 'function') {
                        // 此处不支持Action工厂返回Promise
                        action = action.createRuntimeAction(args);
                        if (!action) {
                            var reason = 'Action factory returns non-action';

                            events.fire(
                                'actionfail',
                                {
                                    url: args.url,
                                    config: actionConfig,
                                    action: action,
                                    reason: reason
                                }
                            );

                            loading.rejected(reason);
                            return;
                        }
                    }

                    events.fire(
                        'actionloaded',
                        {
                            url: acrgs.url,
                            config: actionConfig,
                            action: SpecificAction
                        }
                    );

                    loading.resolve(action, args);
                }
            );

            return loading.promise();
        }

        /**
         * 进入Action的执行周期
         *
         * @param {Object} action `Action`对象
         * @param {Object} context `Action`对象执行的上下文
         */
        function enterAction(action, context) {
            var events = require('./events');

            if (currentAction) {
                events.fire('leaveaction', { action: action });
                
                if (typeof currentAction.leave === 'function') {
                    currentAction.leave();
                }
            }
            currentAction = action;

            require('./events').fire(
                'enteraction',
                require('./util').mix({}, context)
            );

            action.enter(context);
        }

        /**
         * 将URL变更转换到Action的加载
         *
         * @parma {URL} url 当前的URL对象
         */
        function forward(url) {
            // 如果想要把这个方法暴露出去的话，
            // 需要判断URL与currentURL是否相同（正常情况下`locator`层有判断）
            var context = {
                referrer: currentURL,
                url: url,
                container: require('./config').mainElement
            };
            currentURL = url;

            var loading = loadAction(context);

            assert.has(loading, 'loadAction should always return a Promise');

            var events = require('./events');
            var util = require('./util');
            loading.then(enterAction, util.bindFn(events.notifyError, events));
        }

        /**
         * URL与Action的调度器
         */
        var controller = {
            /**
             * 注册一个Action
             *
             * @param {Object} config Action的相关配置
             * @param {string} config.type Action对应模块的id
             * @param {string} config.path 对应的URL的path部分
             * @param {string=} config.movedTo 设定Action跳转至其它路径
             * @param {Array.<string>= | string=} config.authority 访问权限
             * @param {string=} noAuthorityLocation 无权限时的跳转路径
             */
            registerAction: function (config) {
                assert.hasProperty(
                    config, 'path', 
                    'action config should contains a "path" property'
                );

                actionPathMapping[config.path] = config;
                if (config.type) {
                    actionTypeMapping[config.type] = config;
                }
            },

            /**
             * 根据Action的类型获取对应的URL，用于生成访问Action的URL
             *
             * @param {string} actionTeyp Action对应模块的id
             * @param {Object=} query 访问Action时的参数
             * @return {URL} 对应的URL对象
             */
            getPathByAction: function (actionType, query) {
                var actionConfig = actionTypeMapping[actionType];
                if (!actionConfig) {
                    return URL.empty;
                }

                return URL.withQuery(actionConfig.path, query);
            },

            /**
             * 开始`controller`对象的工作
             */
            start: function () {
                // 干脆接管所有路由
                require('./router').setBackup(forward);
            }
        };

        return controller;
    }
);