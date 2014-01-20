/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Deferred类实现
 * @author otakustay
 */
define(
    function (require) {
        var util = require('./util');
        var assert = require('./assert');

        var setImmediate = typeof window.setImmediate === 'function'
            ? function (fn) { window.setImmediate(fn); }
            : function (fn) { window.setTimeout(fn, 0); };

        /**
         * 尝试执行相关的回调函数
         * 
         * 当`deferred`处于非`pending`状态时，根据其状态，
         * 立即异步地运行对应的回调函数
         *
         * @param {Deferred} deferred 需要处理的`Deferred`实例
         * @ignore
         */
        function tryFlush(deferred) {
            if (deferred.state === 'pending') {
                return;
            }

            var callbacks = deferred.state === 'resolved'
                ? deferred._doneCallbacks.slice()
                : deferred._failCallbacks.slice();

            function flush() {
                for (var i = 0; i < callbacks.length; i++) {
                    var callback = callbacks[i];
                    try {
                        // 回调时的this应该是`Promise`，没有`resolve`等方法
                        callback.apply(deferred.promise, deferred._args);
                    }
                    catch (ex) {
                    }
                }
            }

            if (deferred.syncModeEnabled) {
                flush();
            }
            else {
                setImmediate(flush);
            }

            deferred._doneCallbacks = [];
            deferred._failCallbacks = [];
        }

        /**
         * 将一个原有的`Deferred`与一个新的`Deferred`对象连接起来
         * 
         * 该方法作为`then`方法的核心
         *
         * @param {Deferred} original 原`Deferred`对象
         * @param {Deferred} deferred 新`Deferred`对象
         * @param {callback} 当`original`运行完毕后，需要执行的函数
         * @param {string} actionType 关联的动作类型，`"resolve"`或`"reject"`
         * @return {Function} 关联函数，可注册在`original`的相关回调函数上
         * @ignore
         */
        function pipe(original, deferred, callback, actionType) {
            return function () {
                // `.then(done)`及`.then(null, fail)`时使用
                // 
                // 根据`callback`的行为，进行以下处理：
                // 
                // - 如果`callback`返回值，则用该值改`deferred`为`resolved`
                // - 如果`callback`抛出异常，则用异常改`deferred`为`rejected`
                if (typeof callback === 'function') {
                    var resolver = deferred.resolver;
                    try {
                        var returnValue = 
                            callback.apply(original.promise, arguments);

                        if (Deferred.isPromise(returnValue)) {
                            returnValue.then(resolver.resolve, resolver.reject);
                        }
                        else {
                            resolver.resolve(returnValue);
                        }
                    }
                    catch (error) {
                        /**
                         * @event exception
                         *
                         * 当回调函数执行出现错误时触发，
                         * 在此事件后会再触发{@link Deferred#event-reject}事件
                         *
                         *
                         * @param {Deferred} deferred 当前的{@link Deferred}对象
                         * @param {Array} args 抛出的错误对象形成的数组，肯定只有1项
                         * @param {Mixed} reason 抛出的错误对象
                         * @member Deferred
                         * @static
                         */
                        Deferred.fire(
                            'exception',
                            {
                                deferred: original,
                                args: [error],
                                reason: error
                            }
                        );
                        resolver.reject(error);
                    }
                }
                // `.then()`及`.then(done, null)`时使用
                // 
                // 直接使用原`Deferred`保存的参数将`deferred`改为对应状态
                else {
                    deferred[actionType].apply(deferred, original._args);
                }
            };
        }

        /**
         * Deferred类
         * 
         * 类似于jQuery的`Deferred`对象，是对异步操作的一种封装
         *
         * 一个`Deferred`对象是一个{@link meta.Resolver}对象
         * 和一个{@link meta.Promise}的组合，同时提供两者的功能
         *
         * 当创建一个`Deferred`对象后，通过其中的{@link meta.Resolver}对象定义的方法
         * 来控制状态的流转，并将{@link Deferred#promise}返回给调用者来追加回调
         *
         * @mixins mini-event.EventTarget
         * @constructor
         */
        function Deferred() {
            /**
             * @property {string} state
             *
             * 当前对象的状态
             *
             * 一个`Deferred`对象一共有3个状态：
             *
             * - `pending`：还处在等待状态，并没有明确最终结果
             * - `resolved`：任务已经完成，处在成功状态
             * - `rejected`：任务已经完成，处在失败状态
             */
            this.state = 'pending';
            this._args = null;
            this._doneCallbacks = [];
            this._failCallbacks = [];

            /**
             * @property {meta.Promise} promise
             *
             * 与当前对象关联的{@link meta.Promise}对象
             */
            this.promise =  {
                done: util.bind(this.done, this),
                fail: util.bind(this.fail, this),
                ensure: util.bind(this.ensure, this),
                then: util.bind(this.then, this)
            };
            // 形成环引用，保证`.promise.promise`能运行
            this.promise.promise = this.promise;


            /**
             * @property {meta.Resolver} resolver
             *
             * 与当前对象关联的{@link meta.Resolver}对象
             */
            this.resolver = {
                resolve: util.bind(this.resolve, this),
                reject: util.bind(this.reject, this)
            };
        }

        require('mini-event/EventTarget').enable(Deferred);
        
        /**
         * 判断一个对象是否是一个{@link meta.Promise}对象
         * 
         * 该方法采用灵活的判断方式，并非要求`value`为`Deferred`的实例
         *
         * @param {Mixed} value 需要判断的对象
         * @return {boolean} 如果`value`是{@link meta.Promise}对象，则返回`true`
         */
        Deferred.isPromise = function (value) {
            return value && typeof value.then === 'function';
        };

        /**
         * 是否启用同步模式。
         * 
         * 在同步模式下，`Deferred`对象并不符合Promise/A规范，
         * 当对象进入或处于`resolved`或`rejected`状态时，
         * 添加的回调函数会 **立即** 、 **同步** 地被执行。
         *
         * @type {boolean}
         */
        Deferred.prototype.syncModeEnabled = false;

        /**
         * @inheritdoc meta.Resolver#resolve
         */
        Deferred.prototype.resolve = function () {
            if (this.state !== 'pending') {
                return;
            }

            this.state = 'resolved';
            this._args = [].slice.call(arguments);

            /**
             * @event resolve
             *
             * 当任意一个`Deferred`对象进入`resolved`状态时触发
             *
             * @param {Deferred} deferred 当前的{@link Deferred}对象
             * @param {Array} args 改变状态时提供的参数
             * @param {Mixed} reason 相当于`args[0]`，供多数场景下快速访问
             * @member Deferred
             * @static
             */
            Deferred.fire(
                'resolve',
                {
                    deferred: this,
                    args: this._args,
                    reason: this._args[0]
                }
            );

            tryFlush(this);
        };

        /**
         * @inheritdoc meta.Resolver#reject
         */
        Deferred.prototype.reject = function () {
            if (this.state !== 'pending') {
                return;
            }

            this.state = 'rejected';
            this._args = [].slice.call(arguments);

            /**
             * @event reject
             *
             * 当任意一个`Deferred`对象进入`rejected`状态时触发
             *
             * @param {Deferred} deferred 当前的{@link Deferred}对象
             * @param {Array} args 改变状态时提供的参数
             * @param {Mixed} reason 相当于`args[0]`，供多数场景下快速访问
             * @member Deferred
             * @static
             */
            Deferred.fire(
                'reject',
                {
                    deferred: this,
                    args: this._args,
                    reason: this._args[0]
                }
            );

            tryFlush(this);
        };

        /**
         * @inheritdoc meta.Promise#done
         */
        Deferred.prototype.done = function (callback) {
            return this.then(callback);
        };

        /**
         * @inheritdoc meta.Promise#fail
         */
        Deferred.prototype.fail = function (callback) {
            return this.then(null, callback);
        };

        /**
         * @inheritdoc meta.Promise#ensure
         */
        Deferred.prototype.ensure = function (callback) {
            return this.then(callback, callback);
        };

        /**
         * @inheritdoc meta.Promise#then
         */
        Deferred.prototype.then = function (done, fail) {
            var deferred = new Deferred();
            deferred.syncModeEnabled = this.syncModeEnabled;

            this._doneCallbacks.push(pipe(this, deferred, done, 'resolve'));
            this._failCallbacks.push(pipe(this, deferred, fail, 'reject'));

            tryFlush(this);

            return deferred.promise;
        };

        // 暂不支持`progress`，
        // 社区对`progress`处理函数的返回值和异常的传递还在讨论中

        /**
         * 生成一个新的{@link meta.Promise}对象，
         * 当所有给定的{@link meta.Promise}对象完成后触发
         * 
         * 其触发逻辑如下：
         * 
         * - 如果所有给定的{@link meta.Promise}对象均进入`resolved`状态，
         * 则该{@link meta.Promise}对象进入`resolved`状态
         * - 如果有至少一个{@link meta.Promise}对象进入`rejected`状态，
         * 则该{@link meta.Promise}对象进入`rejected`状态
         * 
         * 当新的{@link meta.Promise}对象触发时，
         * 将按照传入的{@link meta.Promise}对象的顺序，
         * 依次提供参数，且根据原{@link meta.Promise}对象的回调参数，有以下情况：
         * 
         * - 如果给定参数只有一个，使用这一个参数
         * - 如果给定多个参数，则提供一个数组包含这些参数
         * 
         * 本方法对参数的方法与`Array.prototyp.concat`相同，任意一个参数是数组则会展开
         *
         * @param {meta.Promise... | meta.Promise[]...} args 需要组合的对象
         * @return {meta.Promise}
         * @static
         */
        Deferred.all = function () {
            // 典型的异步并发归并问题，使用计数器来解决
            var workingUnits = [].concat.apply([], arguments);
            var workingCount = workingUnits.length;

            // 如果没有任何任务，直接给处理完的
            if (!workingCount) {
                return Deferred.resolved();
            }

            var actionType = 'resolve';
            var result = [];

            var jointDeferred = new Deferred();

            function resolveOne(whichToFill) {
                workingCount--;

                assert.greaterThanOrEquals(
                    workingCount, 0, 'workingCount should be positive'
                );

                var unitResult = [].slice.call(arguments, 1);
                // 如果给定的结果只有一个，不要再组装成数组
                if (unitResult.length <= 1) {
                    unitResult = unitResult[0];
                }
                result[whichToFill] = unitResult;

                if (workingCount === 0) {
                    jointDeferred[actionType].apply(jointDeferred, result);
                }
            }

            function rejectOne() {
                actionType = 'reject';
                resolveOne.apply(this, arguments);
            }

            for (var i = 0; i < workingUnits.length; i++) {
                var unit = workingUnits[i];
                unit.then(
                    util.bind(resolveOne, unit, i),
                    util.bind(rejectOne, unit, i)
                );
            }

            return jointDeferred.promise;
        };

        /**
         * 返回一个已经处于`resolved`状态的{@link meta.Promise}对象
         *
         * @param {Mixed...} args 用于调用{@link meta.Resolver#resolve}方法的参数
         * @return {meta.Promise}
         * @static
         */
        Deferred.resolved = function () {
            var deferred = new Deferred();
            deferred.resolve.apply(deferred, arguments);
            return deferred.promise;
        };

        /**
         * 返回一个已经处于`rejected`状态的{@link meta.Promise}对象
         *
         * @param {Mixed...} args 用于调用{@link meta.Resolver#reject}方法的参数
         * @return {meta.Promise}
         * @static
         */
        Deferred.rejected = function () {
            var deferred = new Deferred();
            deferred.reject.apply(deferred, arguments);
            return deferred.promise;
        };

        /**
         * 返回一个以给定值为结果的`resolved`状态的{@link meta.Promise}对象，
         * 该方法可用于统一同步和异步编程模型
         *
         * @param {Mixed} value 给定的值
         * @return {meta.Promise} 如果`value`本身是一个{@link meta.Promise}，
         * 则直接返回其本身。如果`value`是普通对象，
         * 则返回一个 **同步** 的处于`resolved`状态的{@link meta.Promise}，
         * 该{@link meta.Promise}以`value`为值进入`resolved`状态
         * @static
         */
        Deferred.when = function (value) {
            if (Deferred.isPromise(value)) {
                return value;
            }

            // `when`返回的`Promise`必须开启同步模式，以便保留堆栈供单步调度
            var deferred = new Deferred();
            deferred.syncModeEnabled = true;
            deferred.resolve(value);
            return deferred.promise;
        };

        /**
         * 返回一个{@link meta.Promise}对象，
         * 当指定的模块被AMD加载器加载后，进入`resolved`状态
         *
         * @param {string[]} modules 需要加载的模块列表
         * @return {meta.Promise}
         * @static
         */
        Deferred.require = function (modules) {
            var deferred = new Deferred();

            window.require(modules, deferred.resolver.resolve);

            deferred.promise.abort = deferred.resolver.reject;

            return deferred.promise;
        };

        return Deferred;
    }
);
