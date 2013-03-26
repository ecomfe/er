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

        function findActionConfig(args) {
            var path = args.url.getPath();
            var actionConfig = actionPathMapping[path];
            var events = require('./events');

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
                    return null;
                }

                return findActionConfig(args);
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
                return findActionConfig(args);
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
                return findActionConfig(args);
            }

            return actionConfig;
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
            var actionConfig = findActionConfig(args);
            if (!actionConfig) {
                return Deferred.rejected(
                    'no action configured for url ' + args.url.getPath());
            }

            var events = require('./events');
            var loading = new Deferred();

            // 让loadAction返回一个特殊的Promise，
            // 可以通过调用`cancel()`取消Action加载完的后续执行
            var loader = loading.promise;
            var canceled = false;
            loader.cancel = function () {
                canceled = true;
            };

            // local require有可能不支持`callback`参数，
            // 这里强制使用global require
            window.require(
                [actionConfig.type],
                function (SpecificAction) {
                    if (canceled) {
                        return;
                    }

                    // 没有Action配置的`type`属性对应的模块实现
                    if (!SpecificAction) {
                        var reason = 
                            'No action implement for ' + acrtionConfig.type;

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

            return loader;
        }

        /**
         * 进入Action的执行周期
         *
         * @param {Object} action `Action`对象
         * @param {Object} context `Action`对象执行的上下文
         */
        function enterAction(action, context) {
            var events = require('./events');

            if (!context.isChildAction) {
                // 未防止在加载Action模块的时候，用户的操作导致进入其它模块，
                // 这里需要判断当前的URL是否依旧是加载时指定的URL。
                // 如果URL发生了变化，则应当不对Action模块作实例化处理。
                // 
                // 对于ActionA -> ActionB -> ActionA这样的情况，
                // 由于这里的URL是个对象，引用变化判等失败，
                // 因此不用担心ActionA被初始化2次的情况出现
                // 
                // 该判断仅在主Action时有效，子Action需要外部逻辑自己控制
                if (context.url !== currentURL) {
                    return;
                }

                // 是主Action的话，要销毁前面用的那个，并设定当前Action实例
                if (currentAction) {
                    events.fire('leaveaction', { action: action });
                    
                    if (typeof currentAction.leave === 'function') {
                        currentAction.leave();
                    }
                }
                currentAction = action;
            }

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
         * @param {string} container 指定容器元素的id
         * @parma {Object} options 额外的参数
         * @param {boolean} isChildAction 标识是否为子Action
         * @return {Promise} 一个特殊的Promise对象，
         * 该对象可以通过`cancel()`取消Action加载完成后的执行
         */
        function forward(url, container, options, isChildAction) {
            // 如果想要把这个方法暴露出去的话，
            // 需要判断URL与currentURL是否相同（正常情况下`locator`层有判断）
            var context = {
                referrer: currentURL,
                url: url,
                container: container,
                isChildAction: !!isChildAction
            };
            var util = require('./util');
            util.mix(context, options);


            if (!isChildAction) {
                currentURL = url;
            }

            var loader = loadAction(context);

            assert.has(loader, 'loadAction should always return a Promise');

            return loader;
        }

        function renderAction(url) {
            var loader = 
                forward(url, require('./config').mainElement, null, false);
            var events = require('./events');
            var util = require('./util');
            loader.then(enterAction, util.bind(events.notifyError, events));
        }

        var hijackMapping = {};

        // 把挂在容器上的拦截`click`事件的处理函数去掉
        function removeHijack(container) {
            var hijack = hijackMapping[container.id];

            if (!hijack) {
                return;
            }

            hijackMapping[container.id] = undefined;

            if (container.removeEventListener) {
                container.removeEventListener('click', hijack, false);
            }
            else {
                container.detachEvent('onclick', hijack);
            }
        }

        // 添加拦截`click`事件的处理函数
        function addHijack(container, hijack) {
            // 如果发现还有老的`hijack`绑在容器上，先去掉，这个老的不能留，
            // 一般来说，因为`redirect`和`leave`上都有了解除绑定的逻辑，
            // 所以一般上面不会留着东西了。
            // 唯一留着的可能性是，Action是一个普通对象（没有`leave`事件），
            // 而且不是使用`redirect`跳转，而是直接销毁了那个Action。
            removeHijack(container);

            if (container.addEventListener) {
                container.addEventListener('click', hijack, false);
            }
            else {
                container.attachEvent('onclick', hijack);
            }
            hijackMapping[container.id] = hijack;
        }

        function enterChildAction(action, context) {
            var container = document.getElementById(context.container);
            if (!container) {
                return;
            }

            // 这个函数里有`context.container`和`container`两个东西，
            // 其中`context.container`是容器的id，是个字符串，
            // `container`是一个容器DOM元素

            var currentURL = context.url;
            // 用于处理子Action中跳转的特殊`redirect`方法，
            // 接口与`locator.redirect`保持一致
            function redirect(url, options) {
                var url = require('./locator').resolveURL(url, options);

                var changed = url.toString() !== currentURL.toString();
                if (changed || options.force) {
                    events.fire('leaveaction', { action: action });

                    if (typeof action.leave === 'function') {
                        action.leave();
                    }

                    // 如果Action是个普通对象而非继承框架的基类，
                    // 那可能没有`leave`方法及`leave`事件，
                    // 所以在`leave`事件中解绑事件会不执行，
                    // 因此在这里再解绑一次，重复解绑不会出错
                    removeHijack(container);

                    renderChildAction(url, context.container);
                }
            }

            // 需要把`container`上的链接点击全部拦截下来，
            // 如果是hash跳转，则转到controller上来
            function hijack(e) {
                e = e || window.event;
                //下面两行是以主流浏览器为主，兼容IE的事件属性操作
                var target = e.target || e.srcElement;

                // 担心有人在`<span>`之类的上面放`href`属性，还是判断一下标签
                if (target.nodeName.toLowerCase() !== 'a') {
                    return;
                }

                // `<a>`元素也可能没有`href`属性
                var href = target.getAttribute('href', 2) || '';
                // 是hash跳转的链接就取消掉默认的跳转行为
                if (href.charAt(0) !== '#') {
                    return;
                }

                if (e.preventDefault) {
                    e.preventDefault();
                }
                else {
                    e.returnValue = false;
                }

                // 转到`renderChildAction`上
                var url = href.substring(1);

                // 直接使用专供子Action上的`redirect`方法，
                // 会自动处理`hijack`的解绑定、URL比对、进入子Action等事，
                // 为免Action重写`redirect`方法，这里用闭包内的这个
                redirect(url);
            }

            // 把子Action的`redirect`方法改掉，以免影响全局主Action，
            // 这样通过js编码的跳转也会转到`renderChildAction`逻辑上
            action.redirect = redirect;

            // 拦截掉`click`事件
            addHijack(container, hijack);

            var Observable = require('./Observable');
            if (action instanceof Observable) {
                // 在Action销毁的时候要取消掉
                action.on(
                    'leave', 
                    function () {
                        removeHijack(container);
                    }
                );
            }

            enterAction(action, context);
        }

        /**
         * 在指定的元素中渲染一个Action
         *
         * @param {string|URL} Action对应的url
         * @param {string} container 指定容器元素的id
         * @parma {Object=} options 额外的参数
         * @return {Promise} 一个Promise对象，
         * 当渲染完成后进行**resolved**状态，但可在之前调用`cancel()`取消
         */
        function renderChildAction(url, container, options) {
            var assert = require('./assert');
            assert.has(container);

            if (typeof url === 'string') {
                url = require('./URL').parse(url);
            }

            var loader = forward(url, container, options, true);
            var events = require('./events');
            var util = require('./util');
            loader.then(
                enterChildAction,
                util.bind(events.notifyError, events)
            );
            return loader;
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

            renderChildAction: renderChildAction,

            /**
             * 开始`controller`对象的工作
             */
            start: function () {
                // 干脆接管所有路由
                require('./router').setBackup(renderAction);
            }
        };

        return controller;
    }
);
