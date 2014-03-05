/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 控制器实现
 * @author otakustay, erik
 */
define(
    function (require) {
        var actionPathMapping = {}; // 用于根据URL找Action配置
        var currentURL = null;
        var currentAction = null;

        var Deferred = require('./Deferred');
        var URL = require('./URL');
        var config = require('./config');
        var events = require('./events');
        var util = require('./util');
        var assert = require('./assert');

        /**
         * @class controller
         *
         * URL与Action的调度器
         *
         * `controller`负责将URL映射到具体的一个{@link Action}的执行上
         *
         * @singleton
         */
        var controller = {
            /**
             * 注册一个Action
             *
             * @param {meta.ActionConfig} actionConfig Action的相关配置
             */
            registerAction: function (actionConfig) {
                assert.hasProperty(
                    actionConfig, 'path',
                    'action config should contains a "path" property'
                );

                actionPathMapping[actionConfig.path] = actionConfig;
            },

            /**
             * 开始`controller`对象的工作
             */
            start: function () {
                if (!config.systemName) {
                    config.systemName = document.title;
                }

                // 干脆接管所有路由
                require('./router').setBackup(renderAction);
            },

            /**
             * 根据上下文查找适合的{@link meta.ActionConfig}对象
             *
             * @param {meta.ActionContext} actionContext 当前的执行上下文对象
             * @return {meta.ActionConfig | null} 找到的配置对象，找不到返回`null`
             */
            findActionConfig: function (actionContext) {
                var path = actionContext.url.getPath();
                var actionConfig = actionPathMapping[path];
                return actionConfig;
            },

            /**
             * 处理{@link meta.ActionConfig}配置，
             * 在`controller`按默认逻辑查找Action配置后，
             * 会将查找到的配置，以及进入时的{@link meta.ActionContext}参数交给该方法，
             * 该方法可以额外进行一些操作，如在未找到配置时提供默认的映射规则
             *
             * @param {meta.ActionConfig | null} actionConfig 找到的Action配置
             * @param {meta.ActionContext} actionContext 进入流程时提供的参数
             * @return {meta.ActionConfig | null} 一个有效的Action配置对象，
             * 如果确定不存在需要的配置，则返回null
             */
            resolveActionConfig: function (actionConfig, actionContext) {
                return actionConfig;
            },

            /**
             * 检查是否拥有权限
             *
             * 关于框架的默认权限配置及判断策略，
             * 请参考{@link meta.ActionConfig#authority}属性的说明
             *
             * 对于有复杂权限场景的系统，可通过重写此方法来判断权限
             *
             * @param {meta.ActionConfig} actionConfig 查找到的`Action`配置信息
             * @param {meta.ActionContext} actionContext 进入当前`Action`的上下文
             * @return {boolean} 有权限返回`true`，无权限则返回`false`
             */
            checkAuthority: function (actionConfig, actionContext) {
                var authority = actionConfig.authority;

                if (!authority) {
                    return true;
                }

                if (typeof authority === 'function') {
                    return authority(actionContext, actionConfig);
                }

                if (typeof authority === 'string') {
                    authority = authority.split('|');
                }

                var permission = require('./permission');
                for (var i = 0; i < authority.length; i++) {
                    if (permission.isAllow(util.trim(authority[i]))) {
                        return true;
                    }
                }

                return false;
            }
        };

        /**
         * 查找Action配置
         *
         * @param {meta.ActionContext} actionContext 进入Action时的参数
         * @return {meta.ActionConfig | null} 对应的Action配置
         * @ignore
         */
        function findEligibleActionConfig(actionContext) {
            var actionConfig = controller.findActionConfig(actionContext);

            // 判断优先级：
            // movedTo > childActionOnly > 404 > authority

            // 检查Action的跳转，类似302跳转，但地址栏URL不会变，主要用于系统升级迁移
            if (actionConfig && actionConfig.movedTo) {
                events.fire(
                    'actionmoved',
                    {
                        url: actionContext.url,
                        config: actionConfig,
                        movedTo: actionConfig.movedTo
                    }
                );

                actionContext.originalURL = actionContext.url;
                actionContext.url = URL.parse(actionConfig.movedTo);
                return findEligibleActionConfig(actionContext);
            }

            // 如果只允许子Action访问但当前是主Action，就当没找到
            if (actionConfig &&
                (actionConfig.childActionOnly && !actionContext.isChildAction)
            ) {
                actionConfig = null;
            }

            // 关于actionConfig配置项，参考{@link meta.ActionConfig}

            // 以下所有和跳转相关的逻辑均不能用`redirect`，
            // 因为一但有重定向，会在历史记录里多一帧，
            // 此后使用浏览器的后退功能，又会进入重定向逻辑，变成死循环
            // 因此在此处保持路径不变，但加载另一个Action

            // 同时，和跳转相关的逻辑均不能调用`forward`函数，
            // 一但调用`forward`函数，`currentURL`和`referrer`都会变化，
            // 这并不是希望实现的逻辑

            // 如果没有Action的配置，则跳转到404页面
            if (!actionConfig) {
                events.fire(
                    'actionnotfound',
                    util.mix(
                        {
                            failType: 'NotFound',
                            reason: 'Not found'
                        },
                        actionContext
                    )
                );

                actionContext.originalURL = actionContext.url;
                actionContext.url = URL.parse(config.notFoundLocation);

                // 对于404页面，是一切未找到的URL最终归宿，
                // 因此如果404对应的Action没有配置，会进入死循环，
                // 需要对这个配置进行特殊处理，如果没有404对应的Action，
                // 就返回null
                if (!actionPathMapping[actionContext.url.getPath()]) {
                    return null;
                }

                return findEligibleActionConfig(actionContext);
            }

            // 检查权限，如果没有权限的话，根据Action或全局配置跳转
            var hasAuthority =
                controller.checkAuthority(actionConfig, actionContext);
            if (!hasAuthority) {
                events.fire(
                    'permissiondenied',
                    util.mix(
                        {
                            failType: 'PermissionDenied',
                            reason: 'Permission denied',
                            config: actionConfig
                        },
                        actionContext
                    )
                );

                var location = actionConfig.noAuthorityLocation
                    || config.noAuthorityLocation;
                actionContext.originalURL = actionContext.url;
                actionContext.url = URL.parse(location);
                return findEligibleActionConfig(actionContext);
            }

            return actionConfig;
        }

        /**
         * 根据URL加载对应的Action对象
         *
         * @param {meta.ActionContext} actionContext 调用Action的初始化参数
         * @return {meta.Promise} 如果有相应的Action配置，
         * 返回一个{@link meta.Promise}对象，如果正确创建了{@link Action}对象，
         * 则该{@link meta.Promise}对象进入`resolved`状态。
         * 如果没找到{@link Action}的配置或者加载{@link Action}失败，
         * 则该{@link meta.Promise}进入`rejected`状态
         * @ignore
         */
        function loadAction(actionContext) {
            var actionConfig = findEligibleActionConfig(actionContext);
            // 通过`resolveActionConfig`可以配置默认映射关系等，提供扩展点
            if (typeof controller.resolveActionConfig === 'function') {
                actionConfig =
                    controller.resolveActionConfig(actionConfig, actionContext);
            }
            if (!actionConfig) {
                var failed = new Deferred();
                failed.syncModeEnabled = false;
                failed.reject(
                    'no action configured for url '
                    + actionContext.url.getPath()
                );
                return failed.promise;
            }

            // 几个后续需要使用的配置项
            actionContext.title = actionConfig.title;

            // 可在`registerAction`的时候通过`args`属性添加固定的参数，
            // 在`Action`中就可以通过`enter`时的`context`参数里拿到，
            // 对应用框架的话就可以在`model`中拿到
            if (actionConfig.args) {
                // 由于子Action可以传额外参数，可能会和这里的冲突，
                // 这种情况下以`renderChildAction`传过来的参数为优先，
                // 因此不能直接覆盖，要先判断是否存在
                for (var name in actionConfig.args) {
                    if (actionConfig.args.hasOwnProperty(name)
                        && !actionContext.args.hasOwnProperty(name)
                    ) {
                        actionContext.args[name] = actionConfig.args[name];
                    }
                }
            }

            var loading = new Deferred();
            // 别的地方无所谓，但`controller`用的`Deferred`对象必须是异步的，
            // 否则已经加载的Action会变成同步加载，造成不一致性，
            // 导致有些地方等Action加载完触发个事件的，很可能在事件绑上以前就触发了，
            // 比如这种：
            //
            //     function ActionLoader() {
            //          var loading = controller.renderChildAction(...);
            //          loading.done(this.fire.bind(this, 'actionloaded'));
            //     }
            //
            //     var loader = new ActionLoader();
            //     loader.on('actionloaded', ...); // 这里会错过触发
            loading.syncModeEnabled = false;

            // 让loadAction返回一个特殊的Promise，
            // 可以通过调用`abort()`取消Action加载完的后续执行
            var loader = loading.promise;
            var aborted = false;
            loader.abort = function () {
                if (!aborted) {
                    aborted = true;
                    events.fire('actionabort', util.mix({}, actionContext));
                }
            };

            if (!actionContext.isChildAction) {
                currentURL = actionContext.url;
            }

            // local require有可能不支持`callback`参数，
            // 这里强制使用global require
            window.require(
                [actionConfig.type],
                function (SpecificAction) {
                    if (aborted) {
                        return;
                    }

                    // 没有Action配置的`type`属性对应的模块实现
                    if (!SpecificAction) {
                        var reason =
                            'No action implement for ' + acrtionConfig.type;

                        var error = util.mix(
                            {
                                failType: 'NoModule',
                                config: actionConfig,
                                reason: reason
                            },
                            actionContext
                        );
                        events.fire('actionfail', error);
                        events.notifyError(error);

                        loading.reject(reason);
                        return;
                    }

                    // 如果是个函数，则认为是Action的构造函数
                    if (typeof SpecificAction === 'function') {
                        loading.resolve(new SpecificAction(), actionContext);
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
                        action = action.createRuntimeAction(actionContext);
                        if (!action) {
                            var reason = 'Action factory returns non-action';

                            var error = util.mix(
                                {
                                    failType: 'InvalidFactory',
                                    config: actionConfig,
                                    reason: reason,
                                    action: action
                                },
                                actionContext
                            );
                            events.fire('actionfail', error);
                            events.notifyError(error);

                            loading.reject(reason);
                            return;
                        }
                    }

                    events.fire(
                        'actionloaded',
                        {
                            url: actionContext.url,
                            config: actionConfig,
                            action: SpecificAction
                        }
                    );

                    loading.resolve(action, actionContext);
                }
            );

            return loader;
        }

        /**
         * 进入Action的执行周期
         *
         * @param {Action} action {@link Action}对象
         * @param {meta.ActionContext} actionContext Action执行的上下文
         * @ignore
         */
        function enterAction(action, actionContext) {
            if (!actionContext.isChildAction) {
                // 未防止在加载Action模块的时候，用户的操作导致进入其它模块，
                // 这里需要判断当前的URL是否依旧是加载时指定的URL。
                // 如果URL发生了变化，则应当不对Action模块作实例化处理。
                //
                // 对于ActionA -> ActionB -> ActionA这样的情况，
                // 由于这里的URL是个对象，引用变化判等失败，
                // 因此不用担心ActionA被初始化2次的情况出现
                //
                // 该判断仅在主Action时有效，子Action需要外部逻辑自己控制
                if (actionContext.url !== currentURL) {
                    return;
                }

                // 是主Action的话，要销毁前面用的那个，并设定当前Action实例
                if (currentAction) {
                    events.fire(
                        'leaveaction',
                        {
                            action: currentAction,
                            to: util.mix({}, actionContext)
                        }
                    );

                    if (typeof currentAction.leave === 'function') {
                        currentAction.leave();
                    }
                }
                currentAction = action;

                // 只有主Action才有资格改`document.title`
                document.title = actionContext.title
                    || actionContext.documentTitle
                    || config.systemName;
            }

            events.fire(
                'enteraction',
                util.mix({ action: action }, actionContext)
            );

            var entering = action.enter(actionContext);
            entering.then(
                function () {
                    events.fire(
                        'enteractioncomplete',
                        util.mix({ action: action }, actionContext)
                    );
                },
                function (reason) {
                    var message = '';
                    if (!reason) {
                        message = 'Invoke action.enter() causes error';
                    }
                    // 普通异常
                    else if (reason.message) {
                        message = reason.message;
                        if (reason.stack) {
                            message += '\n' + reason.stack;
                        }
                    }
                    // 能够序列化
                    else if (window.JSON
                        && typeof JSON.stringify === 'function'
                    ) {
                        try {
                            message = JSON.stringify(reason);
                        }
                        catch (parseJSONError) {
                            message = reason;
                        }
                    }
                    else {
                        message = reason;
                    }

                    var error = util.mix(
                        {
                            failType: 'EnterFail',
                            reason: message
                        },
                        actionContext
                    );
                    events.fire('enteractionfail', error);
                    events.notifyError(error);
                }
            );

            return entering;
        }

        var childActionMapping = {};

        /**
         * 将URL变更转换到Action的加载
         *
         * @param {URL} url 当前的URL对象
         * @param {string} container 指定容器元素的id
         * @param {Object | null | undefined} options 额外的参数
         * @param {boolean} isChildAction 标识是否为子Action
         * @return {meta.Promise} 一个特殊的{@link meta.Promise}对象，
         * 该对象可以通过`abort()`取消Action加载完成后的执行
         */
        function forward(url, container, options, isChildAction) {
            // 如果想要把这个方法暴露出去的话，
            // 需要判断URL与currentURL是否相同（正常情况下`locator`层有判断）
            var actionContext = {
                url: url,
                container: container,
                isChildAction: !!isChildAction
            };
            actionContext.args = util.mix({}, actionContext);
            if (isChildAction) {
                var referrerInfo = childActionMapping[container];
                actionContext.referrer = referrerInfo ? referrerInfo.url : null;
            }
            else {
                actionContext.referrer = currentURL;
            }

            // 把URL中的参数和作为子Action传过来的参数都放进`args`属性里
            util.mix(
                actionContext.args,
                url.getQuery(),
                options
            );

            events.fire('forwardaction', util.mix({}, actionContext));

            var loader = loadAction(actionContext);

            assert.has(loader, 'loadAction should always return a Promise');

            return loader;
        }

        var globalActionLoader;
        function renderAction(url) {
            if (typeof url === 'string') {
                url = URL.parse(url);
            }
            if (globalActionLoader
                && typeof globalActionLoader.abort === 'function'
            ) {
                globalActionLoader.abort();
            }

            if (currentAction
                && typeof currentAction.filterRedirect === 'function'
                && currentAction.filterRedirect(url) === false
            ) {
                return Deferred.rejected('Redirect aborted by previous action');
            }

            globalActionLoader = forward(url, config.mainElement, null, false);
            return globalActionLoader
                .then(enterAction)
                .fail(util.bind(events.notifyError, events));
        }

        controller.renderAction = renderAction;

        function removeChildAction(container, targetContext) {
            var info = childActionMapping[container.id];
            if (!info) {
                return;
            }

            childActionMapping[container.id] = undefined;

            // 把挂在容器上的拦截`click`事件的处理函数去掉
            if (info.hijack) {
                if (container.removeEventListener) {
                    container.removeEventListener('click', info.hijack, false);
                }
                else {
                    container.detachEvent('onclick', info.hijack);
                }
            }

            if (info.action) {
                if (!targetContext) {
                    targetContext = {
                        url: null,
                        referrer: info.url,
                        container: container.id,
                        isChildAction: true
                    };
                }
                events.fire(
                    'leaveaction',
                    { action: info.action, to: targetContext }
                );

                if (typeof info.action.leave === 'function') {
                    info.action.leave();
                }
            }
        }

        function addChildAction(container, action, hijack, context) {
            // 如果发现还有老的信息绑在容器上，先去掉，这个老的不能留，
            // 一般来说，因为`redirect`和`leave`上都有销毁原Action的逻辑，
            // 所以一般上面不会留着东西了。
            // 唯一留着的可能性是，Action是一个普通对象（没有`leave`事件），
            // 而且不是使用`redirect`跳转或用`renderChildAction`再次在这个容器上渲染，
            // 而是直接销毁了那个Action。
            removeChildAction(container, context);

            // 添加拦截`click`事件的处理函数
            if (container.addEventListener) {
                container.addEventListener('click', hijack, false);
            }
            else {
                container.attachEvent('onclick', hijack);
            }

            var info = {
                url: context.url,
                action: action,
                hijack: hijack
            };
            childActionMapping[container.id] = info;

            var EventTarget = require('mini-event/EventTarget');
            if (action instanceof EventTarget) {
                // 在Action销毁的时候要取消掉
                action.on(
                    'leave',
                    function () {
                        removeChildAction(container);
                    }
                );
            }
        }

        var childActionLoaders = {};

        /**
         * 进入子Action
         *
         * @param {Action} action 子Action实例
         * @param {meta.ActionContext} actionContext Action执行上下文
         * @ignore
         */
        function enterChildAction(action, actionContext) {
            // 把加载用的`loader`去掉回收内存
            childActionLoaders[actionContext.container] = null;

            var container = document.getElementById(actionContext.container);
            if (!container) {
                return;
            }

            // 这个函数里有`context.container`和`container`两个东西，
            // 其中`context.container`是容器的id，是个字符串，
            // `container`是一个容器DOM元素

            // 用于处理子Action中跳转的特殊`redirect`方法，
            // 接口与`locator.redirect`保持一致，
            // 但由于`renderChildAction`可以传额外参数，因此也再加一个参数
            function redirect(url, options, extra) {
                options = options || {};
                var locator = require('./locator');
                var url = locator.resolveURL(url, options);

                // 强制全局跳转，直接使用`locator`即可，
                // 但在这之前要把原来的`Action`灭掉
                if (options.global) {
                    var container =
                        document.getElementById(actionContext.container);
                    if (container) {
                        removeChildAction(container);
                    }

                    locator.redirect(url, options);
                    return;
                }

                var actionContext = childActionMapping[actionContext.container];
                var changed = url.toString() !== actionContext.url.toString();
                if (changed || options.force) {
                    // 静默跳转只要改掉原来映射的URL就行，为了下一次跳转的`referrer`
                    if (options.silent) {
                        actionContext.url = url;
                    }
                    else {
                        // `renderChildAction`中会把原来的Action销毁
                        controller.renderChildAction(
                            url, actionContext.container, extra);
                    }
                }
            }

            // 需要把`container`上的链接点击全部拦截下来，
            // 如果是hash跳转，则转到controller上来
            function hijack(e) {
                // 下面两行是以主流浏览器为主，兼容IE的事件属性操作
                e = e || window.event;
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
                var global = target.getAttribute('data-redirect') === 'global';
                redirect(url, { global: global });
            }

            // 把子Action的`redirect`方法改掉，以免影响全局主Action，
            // 这样通过js编码的跳转也会转到`renderChildAction`逻辑上
            action.redirect = redirect;
            // 同样增加`reload`方法
            action.reload = function (extra) {
                this.redirect(actionContext.url, { force: true }, extra);
            };
            // 同样增加`back`方法
            action.back = function (defaultURL, extra) {
                var referrer = this.context && this.context.referrer;
                var url = referrer || defaultURL;
                this.redirect(url, null, extra);
            };

            // TODO: 添加`back`方法，传递`extra`参数

            addChildAction(container, action, hijack, actionContext);

            return enterAction(action, actionContext);
        }

        /**
         * 在指定的元素中渲染一个子Action
         *
         * @param {string | URL} Action对应的url
         * @param {string} container 指定容器元素的id
         * @param {Object} [options] 交给{@link Action}的额外参数
         * @return {meta.Promise} 一个带取消功能的{@link meta.Promise}对象，
         * 当渲染完成后进行`resolved`状态，但可在之前调用`abort()`取消
         */
        controller.renderChildAction = function (url, container, options) {
            var assert = require('./assert');
            assert.has(container);

            if (typeof url === 'string') {
                url = require('./URL').parse(url);
            }

            var previousLoader = childActionLoaders[container];
            if (previousLoader && typeof previousLoader.abort === 'function') {
                previousLoader.abort();
            }

            var actionInfo = childActionMapping[container];
            var previousAction = actionInfo && actionInfo.action;
            if (previousAction
                && typeof previousAction.filterRedirect === 'function'
                && previousAction.filterRedirect(url) === false
            ) {
                return Deferred.rejected('Redirect aborted by previous action');
            }

            var loader = forward(url, container, options, true);
            var loadingChildAction = loader
                .then(enterChildAction)
                .fail(util.bind(events.notifyError, events));
            // `then`方法会返回一个新的`Promise`，
            // 但原来的`loader`上有个`abort`方法，
            // 要把这个方法留下来
            loadingChildAction.abort = loader.abort;
            childActionLoaders[container] = loadingChildAction;
            return loadingChildAction;
        };

        return controller;
    }
);
