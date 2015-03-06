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
        var Deferred = require('./Deferred');
        var URL = require('./URL');
        var config = require('./config');
        var util = require('./util');
        var assert = require('./assert');

        /**
         * @class Controller
         *
         * 控制器类，负责URL与Action的调度，将URL映射到具体的一个{@link Action}的执行上
         *
         * 通过`require('er/controller').Controller`访问该类构造函数，其中`require('er/controller')`是该类的全局实例
         *
         * @extends mini-event.EventTarget
         * @constructor
         */
        var exports = {};

        exports.constructor = function () {
            this.actionPathMapping = {};
            this.childActionMapping = {};
            this.currentURL = null;
            this.currentAction = null;
            this.globalActionLoader = null;
            this.childActionLoaders = {};
        };

        /**
         * 注册一个或一系列Action
         *
         * @param {meta.ActionConfig | meta.ActionConfig[]} actionConfigs Action的相关配置
         */
        exports.registerAction = function (actionConfigs) {
            if (!actionConfigs.hasOwnProperty('length')) {
                actionConfigs = [actionConfigs];
            }

            for (var i = 0; i < actionConfigs.length; i++) {
                var actionConfig = actionConfigs[i];

                assert.hasProperty(actionConfig, 'path', 'action config should contains a "path" property');

                this.actionPathMapping[actionConfig.path] = actionConfig;
            }
        };

        /**
         * 获取当前实例控制的{@link Action}的默认标题，当一个{@link meta.ActionConfig}未提供`title`属性时，将使用此属性
         *
         * @return {string}
         * @protected
         */
        exports.getDefaultTitle = function () {
            return this.defaultTitle;
        };

        /**
         * 设置当前实例控制的{@link Action}的默认标题
         *
         * @param {string} title 默认的标题
         */
        exports.setDefaultTitle = function (title) {
            this.defaultTitle = title;
        };

        /**
         * 获取当前实例使用的{@link Router}对象
         *
         * @return {Router}
         * @protected
         */
        exports.getRouter = function () {
            return this.router;
        };

        /**
         * 设置当前实例使用的{@link Router}对象
         *
         * @param {Router} router 关联的{@link Router}实例
         */
        exports.setRouter = function (router) {
            this.router = router;
        };

        /**
         * 获取当前实例使用的{@link locator}对象
         *
         * @return {locator}
         * @protected
         */
        exports.getLocator = function () {
            return this.locator;
        };

        /**
         * 设置当前实例使用的{@link locator}对象
         *
         * 可以为任意对象，按{@link locator#event-redirect}实现此事件即可
         *
         * @param {locator} locator 关联的{@link locator}实例
         */
        exports.setLocator = function (locator) {
            this.locator = locator;
        };

        /**
         * 获取当前实例使用的事件总线
         *
         * @return {mini-event.EventTarget}
         * @protected
         */
        exports.getEventBus = function () {
            return this.eventBus;
        };

        /**
         * 设置当前实例使用的事件总线
         *
         * 事件总线可以是任何对象，只要实现`fire`方法供事件触发即可
         *
         * @param {mini-event.EventTarget} eventBus 事件总线对象
         */
        exports.setEventBus = function (eventBus) {
            this.eventBus = eventBus;
        };

        /**
         * 获取当前实例使用的权限控制对象
         *
         * @return {permission}
         * @protected
         */
        exports.getPermissionProvider = function () {
            return this.permissionProvider;
        };

        /**
         * 设置当前实例使用的权限控制对象
         *
         * @param {permission} permissionProvider 关联的权限控制对象
         */
        exports.setPermissionProvider = function (permissionProvider) {
            this.permissionProvider = permissionProvider;
        };

        /**
         * 获取主Action的容器元素id
         *
         * @return {string}
         * @protected
         */
        exports.getMainContainer = function () {
            return this.mainContainer || config.mainElement;
        };

        /**
         * 设置主Action的容器元素id
         *
         * @param {string} mainContainer 主Action的容器元素id
         */
        exports.setMainContainer = function (mainContainer) {
            this.mainContainer = mainContainer;
        };

        /**
         * 获取默认的无权限页URL
         *
         * @return {string}
         * @protected
         */
        exports.getNoAuthorityLocation = function () {
            return this.noAuthorityLocation || config.noAuthorityLocation;
        };

        /**
         * 设置默认的无权限页URL
         *
         * @param {string} noAuthorityLocation 无权限页的URL
         */
        exports.setNoAuthorityLocation = function (noAuthorityLocation) {
            this.noAuthorityLocation = noAuthorityLocation;
        };

        /**
         * 获取当一个URL对应的Action未定义时的跳转URL
         *
         * @return {string}
         * @protected
         */
        exports.getNotFoundLocation = function () {
            return this.notFoundLocation || config.notFoundLocation;
        };

        /**
         * 设置当一个URL对应的Action未定义时的跳转URL
         *
         * @param {string} notFoundLocation 跳转URL
         */
        exports.setNotFoundLocation = function (notFoundLocation) {
            this.notFoundLocation = notFoundLocation;
        };

        /**
         * 开始`controller`对象的工作
         */
        exports.start = function () {
            if (!this.getDefaultTitle()) {
                this.setDefaultTitle(config.systemName || document.title);
            }

            // 干脆接管所有路由
            this.getRouter().setBackup(util.bind(this.renderAction, this));
        };

        /**
         * 根据上下文查找适合的{@link meta.ActionConfig}对象
         *
         * @param {meta.ActionContext} actionContext 当前的执行上下文对象
         * @return {meta.ActionConfig | null} 找到的配置对象，找不到返回`null`
         * @protected
         */
        exports.findActionConfig = function (actionContext) {
            var path = actionContext.url.getPath();
            var actionConfig = this.actionPathMapping[path];
            return actionConfig;
        };

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
         * @protected
         */
        exports.resolveActionConfig = function (actionConfig, actionContext) {
            return actionConfig;
        };

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
         * @protected
         */
        exports.checkAuthority = function (actionConfig, actionContext) {
            var authority = actionConfig.authority;

            if (!authority) {
                return true;
            }

            var permissionProvider = this.getPermissionProvider();

            if (typeof authority === 'function') {
                return authority(actionContext, actionConfig, permissionProvider);
            }

            if (typeof authority === 'string') {
                authority = authority.split('|');
            }

            for (var i = 0; i < authority.length; i++) {
                if (permissionProvider.isAllow(util.trim(authority[i]))) {
                    return true;
                }
            }

            return false;
        };

        /**
         * 查找Action配置
         *
         * @param {meta.ActionContext} actionContext 进入Action时的参数
         * @return {meta.ActionConfig | null} 对应的Action配置
         * @protected
         */
        exports.findEligibleActionConfig = function (actionContext) {
            var actionConfig = this.findActionConfig(actionContext);

            // 判断优先级：
            // movedTo > childActionOnly > 404 > authority

            // 检查Action的跳转，类似302跳转，但地址栏URL不会变，主要用于系统升级迁移
            if (actionConfig && actionConfig.movedTo) {
                this.getEventBus().fire(
                    'actionmoved',
                    {
                        controller: this,
                        url: actionContext.url,
                        config: actionConfig,
                        movedTo: actionConfig.movedTo
                    }
                );

                actionContext.originalURL = actionContext.url;
                actionContext.url = URL.parse(actionConfig.movedTo);
                return this.findEligibleActionConfig(actionContext);
            }

            // 如果只允许子Action访问但当前是主Action，就当没找到
            if (actionConfig && (actionConfig.childActionOnly && !actionContext.isChildAction)) {
                actionConfig = null;
            }

            // 关于actionConfig配置项，参考{@link meta.ActionConfig}

            // 以下所有和跳转相关的逻辑均不能用`redirect`，因为一但有重定向，会在历史记录里多一帧，
            // 此后使用浏览器的后退功能，又会进入重定向逻辑，变成死循环，因此在此处保持路径不变，但加载另一个Action

            // 同时，和跳转相关的逻辑均不能调用`forward`函数，
            // 一但调用`forward`函数，`currentURL`和`referrer`都会变化，这并不是希望实现的逻辑

            // 如果没有Action的配置，则跳转到404页面
            if (!actionConfig) {
                this.getEventBus().fire(
                    'actionnotfound',
                    util.mix(
                        {
                            controller: this,
                            failType: 'NotFound',
                            reason: 'Not found'
                        },
                        actionContext
                    )
                );

                actionContext.originalURL = actionContext.url;
                actionContext.url = URL.parse(this.getNotFoundLocation());

                // 对于404页面，是一切未找到的URL最终归宿，因此如果404对应的Action没有配置，会进入死循环，
                // 需要对这个配置进行特殊处理，如果没有404对应的Action，就返回null
                if (!this.actionPathMapping[actionContext.url.getPath()]) {
                    return null;
                }

                return this.findEligibleActionConfig(actionContext);
            }

            // 检查权限，如果没有权限的话，根据Action或全局配置跳转
            var hasAuthority = this.checkAuthority(actionConfig, actionContext);
            if (!hasAuthority) {
                this.getEventBus().fire(
                    'permissiondenied',
                    util.mix(
                        {
                            controller: this,
                            failType: 'PermissionDenied',
                            reason: 'Permission denied',
                            config: actionConfig
                        },
                        actionContext
                    )
                );

                var location = actionConfig.noAuthorityLocation || this.getNoAuthorityLocation();
                actionContext.originalURL = actionContext.url;
                actionContext.url = URL.parse(location);
                return this.findEligibleActionConfig(actionContext);
            }

            return actionConfig;
        };

        /**
         * 根据URL加载对应的Action对象
         *
         * @param {meta.ActionContext} actionContext 调用Action的初始化参数
         * @return {meta.Promise} 如果有相应的Action配置，返回一个{@link meta.Promise}对象。
         * 如果正确创建了{@link Action}对象，则该{@link meta.Promise}对象进入`resolved`状态。
         * 如果没找到{@link Action}的配置或者加载{@link Action}失败，则该{@link meta.Promise}进入`rejected`状态
         * @protected
         */
        exports.loadAction = function (actionContext) {
            var actionConfig = this.findEligibleActionConfig(actionContext);
            // 通过`resolveActionConfig`可以配置默认映射关系等，提供扩展点
            actionConfig = this.resolveActionConfig(actionConfig, actionContext);
            if (!actionConfig) {
                var failed = new Deferred();
                failed.syncModeEnabled = false;
                failed.reject('no action configured for url ' + actionContext.url.getPath());
                return failed.promise;
            }

            // 几个后续需要使用的配置项
            if (actionConfig.title) {
                actionContext.title = actionConfig.title;
                actionContext.args.title = actionConfig.title;
            }
            if (actionConfig.documentTitle) {
                actionContext.documentTitle = actionConfig.documentTitle;
                actionContext.args.documentTitle = actionConfig.documentTitle;
            }

            // 可在`registerAction`的时候通过`args`属性添加固定的参数，
            // 在`Action`中就可以通过`enter`时的`context`参数里拿到，对应用框架的话就可以在`model`中拿到
            if (actionConfig.args) {
                // 由于子Action可以传额外参数，可能会和这里的冲突，
                // 这种情况下以`renderChildAction`传过来的参数为优先，因此不能直接覆盖，要先判断是否存在
                //
                // 同时为了保持向后兼容，`args`中的东西要直接放到`actionContext`下面，同样考虑相互覆盖的问题
                for (var name in actionConfig.args) {
                    if (actionConfig.args.hasOwnProperty(name)) {
                        if (!actionContext.args.hasOwnProperty(name)) {
                            actionContext.args[name] = actionConfig.args[name];
                        }
                        if (!actionContext.hasOwnProperty(name)) {
                            actionContext[name] = actionConfig.args[name];
                        }
                    }
                }
            }

            var loading = new Deferred();
            // 别的地方无所谓，但`controller`用的`Deferred`对象必须是异步的，否则已经加载的Action会变成同步加载，造成不一致性，
            // 导致有些地方等Action加载完触发个事件的，很可能在事件绑上以前就触发了，比如这种：
            //
            //     function ActionLoader() {
            //          var loading = controller.renderChildAction(...);
            //          loading.done(this.fire.bind(this, 'actionloaded'));
            //     }
            //
            //     var loader = new ActionLoader();
            //     loader.on('actionloaded', ...); // 这里会错过触发
            loading.syncModeEnabled = false;

            // 让loadAction返回一个特殊的Promise，可以通过调用`abort()`取消Action加载完的后续执行
            var loader = loading.promise;
            var aborted = false;
            var abort = function () {
                if (!aborted) {
                    aborted = true;
                    this.getEventBus().fire('actionabort', util.mix({controller: this}, actionContext));
                }
            };
            loader.abort = util.bind(abort, this);

            if (!actionContext.isChildAction) {
                this.currentURL = actionContext.url;
            }

            var callback = function (SpecificAction) {
                if (aborted) {
                    return;
                }

                // 没有Action配置的`type`属性对应的模块实现
                if (!SpecificAction) {
                    var reason = 'No action implement for ' + actionConfig.type;

                    var error = util.mix(
                        {
                            controller: this,
                            failType: 'NoModule',
                            config: actionConfig,
                            reason: reason
                        },
                        actionContext
                    );
                    this.getEventBus().fire('actionfail', error);
                    this.getEventBus().notifyError(error);

                    loading.reject(reason);
                    return;
                }

                this.getEventBus().fire(
                    'actionloaded',
                    {
                        controller: this,
                        url: actionContext.url,
                        config: actionConfig,
                        action: SpecificAction
                    }
                );

                // 对获得的类型的处理逻辑：
                //
                // 1. 如果是一个函数，则认为是`Action`类构造函数，直接使用`new`生成实例
                // 2. 如果是一个普通的对象，则
                //     1. 如果对象没有`createRuntimeAction`方法，则认为是`Action`实例直接使用
                //     2. 如果有`createRuntimeAction`方法，则认为是一个工厂，调用此方法获得`Action`实例，则
                //         1. 如果工厂方法返回一个普通的对象，则直接作为`Action`实例使用
                //         2. 如果工厂方法返回一个`Promise`，则等待`resolve`之后获取`Action`实例使用

                // 如果是个函数，则认为是Action的构造函数
                if (typeof SpecificAction === 'function') {
                    loading.resolve(new SpecificAction(), actionContext);
                }
                // 处理Action工厂，Action工厂是一个对象，它能生产出一个Action对象，有`createRuntimeAction`方法的对象即为Action工厂
                else if (typeof SpecificAction.createRuntimeAction === 'function') {
                    // `createRuntimeAction`可能返回`Promise`，统一处理
                    var resolveActionInstance = function (action) {
                        if (!action) {
                            var reason = 'Action factory returns non-action';

                            var error = util.mix(
                                {
                                    controller: this,
                                    failType: 'InvalidFactory',
                                    config: actionConfig,
                                    reason: reason,
                                    action: action
                                },
                                actionContext
                            );
                            this.getEventBus().fire('actionfail', error);
                            this.getEventBus().notifyError(error);

                            loading.reject(reason);
                        }
                        else {
                            loading.resolve(action, actionContext);
                        }
                    };
                    resolveActionInstance = util.bind(resolveActionInstance, this);
                    var actionFactoryProduct = SpecificAction.createRuntimeAction(actionContext);
                    Deferred.when(actionFactoryProduct).then(resolveActionInstance);
                }
                // 直接是个`Action`实例
                else {
                    loading.resolve(SpecificAction, actionContext);
                }
            };
            callback = util.bind(callback, this);

            // 如果`type`配置的直接是一个对象或者一个函数，则认为是一个已经加载了的模块
            if (typeof actionConfig.type === 'string') {
                window.require([actionConfig.type], callback);
            }
            else {
                callback(actionConfig.type);
            }

            return loader;
        };

        /**
         * 进入Action的执行周期
         *
         * @param {Action} action {@link Action}对象
         * @param {meta.ActionContext} actionContext Action执行的上下文
         * @return {meta.Promise}
         * @protected
         */
        exports.enterAction = function (action, actionContext) {
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
                if (actionContext.url !== this.currentURL) {
                    return;
                }

                // 是主Action的话，要销毁前面用的那个，并设定当前Action实例
                if (this.currentAction) {
                    this.getEventBus().fire(
                        'leaveaction',
                        {
                            controller: this,
                            action: this.currentAction,
                            to: util.mix({}, actionContext)
                        }
                    );

                    if (typeof this.currentAction.leave === 'function') {
                        this.currentAction.leave();
                    }
                }
                this.currentAction = action;

                // 只有主Action才有资格改`document.title`
                document.title = actionContext.title || actionContext.documentTitle || this.getDefaultTitle();
            }

            this.getEventBus().fire(
                'enteraction',
                util.mix({controller: this, action: action}, actionContext)
            );

            var notifyEnterComplete = function () {
                this.getEventBus().fire(
                    'enteractioncomplete',
                    util.mix({controller: this, action: action}, actionContext)
                );
            };
            notifyEnterComplete = util.bind(notifyEnterComplete, this);

            var notifyEnterFail = function (reason) {
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
                else if (window.JSON && typeof JSON.stringify === 'function') {
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
                        controller: this,
                        action: action,
                        failType: 'EnterFail',
                        reason: message
                    },
                    actionContext
                );
                this.getEventBus().fire('enteractionfail', error);
                this.getEventBus().notifyError(error);
            };
            notifyEnterFail = util.bind(notifyEnterFail, this);

            var entering = action.enter(actionContext);
            entering.then(notifyEnterComplete, notifyEnterFail);

            return entering;
        };

        /**
         * 将URL变更转换到Action的加载
         *
         * `forward`方法是核心方法，{@link Controller#renderAction}和{@link Controller#renderChildAction}最终都调用此方法
         *
         * @param {URL} url 当前的URL对象
         * @param {string} container 指定容器元素的id
         * @param {Object | null | undefined} options 额外的参数
         * @param {boolean} isChildAction 标识是否为子Action
         * @return {meta.Promise} 一个特殊的{@link meta.Promise}对象，该对象可以通过`abort()`取消Action加载完成后的执行
         * @protected
         */
        exports.forward = function (url, container, options, isChildAction) {
            // 如果想要把这个方法暴露出去的话，需要判断URL与currentURL是否相同（正常情况下`locator`层有判断）
            var actionContext = {
                url: url,
                container: container,
                isChildAction: !!isChildAction
            };

            // 如果是子Action的话，从保存的之前的`ActionContext`中拿到`referrer`
            if (isChildAction) {
                var referrerInfo = this.childActionMapping[container];
                actionContext.referrer = referrerInfo ? referrerInfo.url : null;
            }
            else {
                actionContext.referrer = this.currentURL;
            }

            // 为了向后兼容性，`options`中的东西要放到`actionContext`上
            util.mix(actionContext, options);

            // `args`有一份和`actionContext`一模一样的数据
            actionContext.args = util.mix({}, actionContext);

            // 除此之外，再把URL中的参数和作为子Action传过来的参数都放进`args`属性里
            util.mix(actionContext.args, url.getQuery());

            this.getEventBus().fire('forwardaction', util.mix({controller: this}, actionContext));

            var loader = this.loadAction(actionContext);

            assert.has(loader, 'loadAction should always return a Promise');

            return loader;
        };

        /**
         * 在主Action区域加载并渲染指定URL对应的Action
         *
         * @param {string | URL} url 需要加载的URL
         * @return {meta.Promise}
         */
        exports.renderAction = function (url) {
            if (typeof url === 'string') {
                url = URL.parse(url);
            }
            if (this.globalActionLoader && typeof this.globalActionLoader.abort === 'function') {
                this.globalActionLoader.abort();
            }

            if (this.currentAction
                && typeof this.currentAction.filterRedirect === 'function'
                && this.currentAction.filterRedirect(url) === false
            ) {
                return Deferred.rejected('Redirect aborted by previous action');
            }

            this.globalActionLoader = this.forward(url, this.getMainContainer(), null, false);
            var events = this.getEventBus();
            return this.globalActionLoader
                .then(util.bind(this.enterAction, this))
                .fail(util.bind(events.notifyError, events));
        };

        /**
         * 移除指定容器上的子Action
         *
         * @param {Controller} controller 对应的控制器实例
         * @param {HTMLElement} container 指定的容器
         * @param {meta.ActionContext} [targetContext] 如果是因跳转引起的移除操作，则传递目标{@link meta.ActionContext}对象
         * @ignore
         */
        function removeChildAction(controller, container, targetContext) {
            var info = controller.childActionMapping[container.id];
            if (!info) {
                return;
            }

            controller.childActionMapping[container.id] = undefined;

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
                controller.getEventBus().fire(
                    'leaveaction',
                    {controller: controller, action: info.action, to: targetContext}
                );

                if (typeof info.action.leave === 'function') {
                    info.action.leave();
                }
            }
        }

        /**
         * 向指定容器添加一个子Action
         *
         * @param {Controller} controller 对应的控制器实例
         * @param {HTMLElement} container 指定的容器
         * @param {Object} action 对应的Action对象
         * @param {Function} hijack 一个用来拦截子Action内部点击的处理函数
         * @param {meta.ActionContext} context 对应的Action上下文
         * @ignore
         */
        function addChildAction(controller, container, action, hijack, context) {
            // 如果发现还有老的信息绑在容器上，先去掉，这个老的不能留，
            // 一般来说，因为`redirect`和`leave`上都有销毁原Action的逻辑，所以一般上面不会留着东西了。
            // 唯一留着的可能性是，Action是一个普通对象（没有`leave`事件），
            // 而且不是使用`redirect`跳转或用`renderChildAction`再次在这个容器上渲染，而是直接销毁了那个Action。
            removeChildAction(controller, container, context);

            // 添加拦截`click`事件的处理函数
            if (container.addEventListener) {
                container.addEventListener('click', hijack, false);
            }
            else {
                container.attachEvent('onclick', hijack);
            }

            var info = {
                url: context.url,
                container: container.id,
                action: action,
                hijack: hijack
            };
            controller.childActionMapping[container.id] = info;

            var EventTarget = require('mini-event/EventTarget');
            if (action instanceof EventTarget) {
                // 在Action销毁的时候要取消掉
                action.on(
                    'leave',
                    function () {
                        removeChildAction(controller, container);
                    }
                );
            }
        }

        /**
         * 进入子Action
         *
         * @param {Action} action 子Action实例
         * @param {meta.ActionContext} actionContext Action执行上下文
         * @return {meta.Promise}
         * @protected
         */
        exports.enterChildAction = function (action, actionContext) {
            // 把加载用的`loader`去掉回收内存
            this.childActionLoaders[actionContext.container] = null;

            var container = document.getElementById(actionContext.container);
            if (!container) {
                return;
            }

            // 这个函数里有`context.container`和`container`两个东西，区别在于：
            // - `context.container`是容器的id，是个字符串，
            // - `container`是一个容器DOM元素

            // 用于处理子Action中跳转的特殊`redirect`方法，接口与`locator.redirect`保持一致，
            // 但由于`renderChildAction`可以传额外参数，因此也再加一个参数
            var locator = this.getLocator();
            var currentController = this;
            function redirect(url, options, extra) {
                options = options || {};
                url = locator.resolveURL(url);

                // 强制全局跳转，直接使用`locator`即可，但在这之前要把原来的`Action`灭掉
                if (options.global) {
                    var container = document.getElementById(actionContext.container);

                    var globalRedirectPerformed = locator.redirect(url, options);
                    // 如果因为URL相等的原因没有完成跳转，那就别销毁子Action，相当于点击没任何效果
                    if (globalRedirectPerformed && container) {
                        removeChildAction(currentController, container);
                    }
                    return globalRedirectPerformed;
                }

                var childActionInfo = currentController.childActionMapping[actionContext.container];
                var changed = url.toString() !== childActionInfo.url.toString();
                var shouldPerformRedirect = changed || options.force;
                if (shouldPerformRedirect) {
                    // 静默跳转只要改掉原来映射的URL就行，为了下一次跳转的`referrer`
                    if (options.silent) {
                        childActionInfo.url = url;
                    }
                    else {
                        // `renderChildAction`中会把原来的Action销毁
                        currentController.renderChildAction(url, childActionInfo.container, extra);
                    }
                }

                return shouldPerformRedirect;
            }

            // 判断一个子Action中链接点击是否已经由对应的子Action处理了跳转,
            // 如果是2层以上的子Action嵌套，下层Action处理完跳转后，因为没有（也不能）阻止冒泡，
            // 所以上层的Action容器也会抓到这个事件，此时再去跳转是不合理的，需要有个判断
            function isChildActionRedirected(e) {
                // 除低版本IE外，其它浏览器是可以在事件对象上加自定义属性的，IE每次都生成新的事件对象所以保留不了这些属性，
                // 在这里优先用自定义属性控制，避免对DOM树无意义的遍历，只有在没有属性的时候，才向后兼容至DOM树的遍历
                if (e.isChildActionRedirected) {
                    return true;
                }

                var innermostContainer = e.target || e.srcElement;
                while (innermostContainer) {
                    // 是Action容器的元素肯定符合以下条件：
                    //
                    // - 有个`id`，因为没有`id`不能渲染子Action
                    // - 这个`id`在`childActionMapping`里是有对应的值的
                    if (innermostContainer.id && currentController.childActionMapping[innermostContainer.id]) {
                        break;
                    }

                    innermostContainer = innermostContainer.parentNode;
                }
                // 如果最接近被点击的链接的Action容器是不是当前的这个容器，就说明在当前容器和链接之间还有一层以上的子Action，
                // 那么这个子Action肯定会处理掉这个链接的跳转，不需要这里处理了
                if (innermostContainer.id !== actionContext.container) {
                    e.isChildActionRedirected = true;
                    return true;
                }

                return false;
            }

            // 需要把`container`上的链接点击全部拦截下来，如果是hash跳转，则转到controller上来
            function hijack(e) {
                // 下面两行是以主流浏览器为主，兼容IE的事件属性操作
                e = e || window.event;
                var target = e.target || e.srcElement;

                // 担心有人在`<span>`之类的上面放`href`属性，还是判断一下标签
                if (target.nodeName.toLowerCase() !== 'a') {
                    return;
                }

                // 不要任何不在本页面内打开的东西，包括`_blank`、`_tab`以及指定其它`iframe`等
                var linkTarget = target.getAttribute('target');
                if (linkTarget && linkTarget !== '_self') {
                    return;
                }

                // `<a>`元素也可能没有`href`属性
                var href = target.getAttribute('href', 2) || '';
                // 是hash跳转的链接就取消掉默认的跳转行为
                if (href.charAt(0) !== '#') {
                    return;
                }

                // 处理一下`data-redirect`
                var redirectAttributes = (target.getAttribute('data-redirect') || '').split(/[,\s]/);
                var redirectOptions = {};
                for (var i = 0; i < redirectAttributes.length; i++) {
                    var redirectAttributeName = util.trim(redirectAttributes[i]);
                    if (redirectAttributeName) {
                        redirectOptions[redirectAttributeName] = true;
                    }
                }

                // 如果非全局跳转且下面的子Action处理了跳转，那这里就啥也不干了
                if (!redirectOptions.global && isChildActionRedirected(e)) {
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
                redirect(url, redirectOptions);
            }

            // 把子Action的`redirect`方法改掉，以免影响全局主Action，
            // 这样通过js编码的跳转也会转到`renderChildAction`逻辑上
            action.redirect = redirect;
            // 同样增加`reload`方法
            action.reload = function (extra) {
                this.redirect(actionContext.url, {force: true}, extra);
            };
            // 同样增加`back`方法
            action.back = function (defaultURL, extra) {
                var referrer = this.context && this.context.referrer;
                var url = referrer || defaultURL;
                this.redirect(url, null, extra);
            };

            addChildAction(this, container, action, hijack, actionContext);

            return this.enterAction(action, actionContext);
        };

        /**
         * 在指定的元素中渲染一个子Action
         *
         * @param {string | URL} url Action对应的url
         * @param {string} container 指定容器元素的id
         * @param {Object} [options] 交给{@link Action}的额外参数
         * @return {meta.Promise} 一个可取消的{@link meta.Promise}对象，当渲染完成后进行`resolved`状态，但可在之前调用`abort()`取消
         */
        exports.renderChildAction = function (url, container, options) {
            assert.has(container);

            if (typeof url === 'string') {
                url = URL.parse(url);
            }

            var previousLoader = this.childActionLoaders[container];
            if (previousLoader && typeof previousLoader.abort === 'function') {
                previousLoader.abort();
            }

            var actionInfo = this.childActionMapping[container];
            var previousAction = actionInfo && actionInfo.action;
            if (previousAction
                && typeof previousAction.filterRedirect === 'function'
                && previousAction.filterRedirect(url) === false
            ) {
                return Deferred.rejected('Redirect aborted by previous action');
            }

            var loader = this.forward(url, container, options, true);
            var events = this.getEventBus();
            var loadingChildAction = loader
                .then(util.bind(this.enterChildAction, this))
                .fail(util.bind(events.notifyError, events));
            // `then`方法会返回一个新的`Promise`，但原来的`loader`上有个`abort`方法，要把这个方法留下来
            loadingChildAction.abort = loader.abort;
            this.childActionLoaders[container] = loadingChildAction;
            return loadingChildAction;
        };

        var Controller = require('eoo').create(require('mini-event/EventTarget'), exports);
        var instance = new Controller();
        instance.setLocator(require('./locator'));
        instance.setRouter(require('./router'));
        instance.setEventBus(require('./events'));
        instance.setPermissionProvider(require('./permission'));
        instance.Controller = Controller;
        return instance;
    }
);
