/**
 * ER (Enterprise RIA)
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * @file 控制器实现
 * @author otakustay, erik
 */
define(
    'controller',
    function(require) {
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
         * @param {Array<string>|string} authority 权限配置
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
         * @return {Promise|null} 如果有相应的Action配置，返回一个Promise对象，
         *     当Action实例创建完毕后会执行`resolve`操作。否则返回null
         */
        function loadAction(args) {
            var path = args.url.getPath();
            var actionConfig = actionPathMapping[path];

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

            // TODO: 这个死循环的问题是否有更好的方式解决

            // 同时，和跳转相关的逻辑均不能调用`forward`函数，
            // 一但调用`forward`函数，`currentURL`和`referrer`都会变化，
            // 这并不是希望实现的逻辑

            // 如果没有Action的配置，则跳转到404页面
            if (!actionConfig) {
                args.url = URL.parse(config.notFoundLocation);
                // 对于404页面，是一切未找到的URL最终归宿，
                // 因此如果404对应的Action没有配置，会进入死循环，
                // 需要对这个配置进行特殊处理，如果没有404对应的Action，
                // 就返回null
                if (!actionPathMapping[args.url.getPath()]) {
                    throw new Error('no action configured');
                }
                return loadAction(args);
            }

            // 检查权限，如果没有权限的话，根据Action或全局配置跳转
            var hasAuthority = checkAuthority(actionConfig.authority);
            if (!hasAuthority) {
                var location = actionConfig.noAuthorityLocation 
                    || config.noAuthorityLocation;
                args.url = URL.parse(location);
                return loadAction(args);
            }

            // 检查Action的跳转，类似302跳转，用于系统升级迁移
            if (actionConfig.movedTo) {
                var forwardURL = URL.parse(actionConfig.movedTo);
                args.url = forwardURL;
                return loadAction(args);
            }

            var loading = new Deferred();
            require(
                actionConfig.type,
                function(SpecificAction) {
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

                    var action = typeof SpecificAction === 'function'
                        ? new SpecificAction()
                        : SpecificAction;
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
            if (currentAction) {
                if (typeof currentAction.leave === 'function') {
                    currentAction.leave();
                }
            }
            currentAction = action;
            action.enter(context);

            // TODO: 这个`currentAction`是否应当暴露出来让开发者可以访问到，
            //       类似`require('./controller').currentAction`的方式。
            //       理论上，需要使用`currentAction`应该是业务设计上的缺陷，
            //       应当可以用其它更好的方式进行弥补，但是考虑到便捷性，
            //       是否真的存在用`currentAction`更好的场景？
        }

        /**
         * 将URL变更转换到Action的加载
         *
         * @parma {URL} url 当前的URL对象
         */
        function forward(url) {
            // TODO: 是否需要判断URL与currentURL是否相同（`locator`层有判断）

            var context = {
                referrer: currentURL,
                url: url,
                container: require('./config').mainElement
            };
            currentURL = url;

            var loading = loadAction(context);

            assert.has(loading, 'loadAction should always find an Action');

            loading.done(enterAction);
        }

        /**
         * 开始`controller`对象的工作
         */
        function start() {
            // 干脆接管所有路由
            require('./router').setBackup(forward);
        }

        start(); 
        // TODO: 是否由用户决定调用

        return {
            /**
             * 注册一个Action
             *
             * @param {Object} config Action的相关配置
             * @param {string} config.type Action对应模块的id
             * @param {string} config.path 对应的URL的path部分
             */
            registerAction: function(config) {
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
            getPathByAction: function(actionType, query) {
                var actionConfig = actionTypeMapping[actionType];
                if (!actionConfig) {
                    return URL.empty;
                }

                return URL.withQuery(actionConfig.path, query);
            }
        };

        // TODO: `loadSub`如何实现
    }
);