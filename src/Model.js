/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Model类
 * @author otakustay
 */
define(
    function (require) {
        var util = require('./util');
        var Deferred = require('./Deferred');

        var SILENT = { silent: true };

        /**
         * 加载一个数据
         *
         * @param {Model} model 用于存放数据的`Model`对象
         * @param {meta.DatasourceOption} options 数据获取配置项
         * @return {meta.Promise} 对应的`Promise`对象，数据加载完成后触发
         * @ignore
         */
        function loadData(model, options) {
            function addDataToModel(value) {
                if (options.dump) {
                    model.fill(value, SILENT);
                }
                else {
                    model.set(options.name, value, SILENT);
                }
                return {
                    success: true,
                    name: options.name,
                    options: options,
                    value: value
                };
            }

            function buildError(error) {
                return {
                    success: false,
                    name: options.name,
                    options: options,
                    error: error
                };
            }

            try {
                var value = options.retrieve(model, options);

                if (Deferred.isPromise(value)) {
                    if (typeof value.abort === 'function') {
                        model.addPendingWorker(value);
                    }
                    return value.then(
                        addDataToModel,
                        function (error) {
                            error = buildError(error);
                            try {
                                var result = model.handleError(error);
                                return addDataToModel(result);
                            }
                            catch (ex) {
                                if (ex.success === false) {
                                    throw ex;
                                }
                                else {
                                    throw buildError(ex);
                                }
                            }
                        }
                    );
                }
                else {
                    var result = addDataToModel(value);
                    return Deferred.resolved(result);
                }
            }
            catch (ex) {
                var error = buildError(ex);
                return Deferred.rejected(error);
            }
        }

        /**
         * 按顺序加载一个数组中的各项数据
         *
         * @param {Model} model 用于存放数据的`Model`对象
         * @param {meta.DatasourceOption[]} datasource 数据原配置
         * @return {meta.Promise} 对应的`Promise`对象，数据加载完成后触发
         * @ignore
         */
        function loadSequence(model, datasource) {
            // 第一个Promise是直接成功的，以便开始第一块的加载
            var loading = Deferred.resolved();
            for (var i = 0; i < datasource.length; i++) {
                var unit = datasource[i];
                var task = util.bind(load, null, model, unit);
                loading = loading.then(task);
            }
            return loading;
        }

        /**
         * 并行加载一批数据
         *
         * @param {Model} model 用于存放数据的`Model`对象
         * @param {Object} datasource 数据源配置，
         * 此对象中的每个值是一个{@link meta.DatasourceOption}对象
         * @return {Promise} 对应的`Promise`对象，数据加载完成后触发
         * @ignore
         */
        function loadParallel(model, datasource) {
            var workers = [];
            for (var name in datasource) {
                if (datasource.hasOwnProperty(name)) {
                    var unit = datasource[name];

                    // 如果直接表达获取数据的内容（函数或数据获取配置项），
                    // 则需要加上对应的属性名。
                    // 其它情况下（值为嵌套的数组或对象），属性名将没有意义
                    if (typeof unit === 'function') {
                        unit = { retrieve: unit, name: name };
                    }
                    else if (typeof unit.retrieve === 'function') {
                        unit = util.mix({ name: name }, unit);
                    }

                    workers.push(load(model, unit));
                }
            }

            return Deferred.all(workers);
        }

        /**
         * 根据数据源配置加载数据
         *
         * 该函数处理所有数据项配置的情况
         *
         * @param {Model} model 用于存放数据的`Model`对象
         * @param {Object} datasource 数据源配置
         * @return {Promise} 对应的`Promise`对象，数据加载完成后触发
         * @ignore
         */
        function load(model, datasource) {
            // 允许datasource是null或undefined，
            // 这样根据权限灵活的配置某个数据是否加载很方便
            if (!datasource) {
                return Deferred.resolved();
            }

            // 是函数的话，函数即获取数据的函数，包装为数据获取配置项
            if (typeof datasource === 'function') {
                var options = { retrieve: datasource, dump: true };
                return loadData(model, options);
            }

            // 是数组的话，数组中的各项串行加载
            if (datasource instanceof Array) {
                return loadSequence(model, datasource);
            }

            // 当一个对象中有`retrieve`属性就认为是一个数据获取配置项
            if (typeof datasource.retrieve === 'function') {
                return loadData(model, datasource);
            }

            // 是一个并行加载的配置对象
            return loadParallel(model, datasource);
        }

        /**
         * @class Model
         *
         * 在ER框架中，Model并不一定要继承该类，任何对象都可以作为Model使用
         *
         * ER对于Model的处理如下：
         *
         * 1. 通过Action的`createModel`创建一个对象
         * 2. 如果该对象有`load`函数，则执行该函数，并分为以下情况：
         *     - 如果`load`函数返回一个Promise，则认为是异步加载
         *     - 反之则认为是同步加载，对象已经直接可以使用
         * 3. 如果对象没有`load`函数，则默认对象本身就是Model
         * 4. 当离开Action时，如果Model有`dispose`方法，则会调用以销毁对象
         *
         * 该Model类为一个通用的可配置的基类，提供了数据加载的相关方法
         *
         * @extends mini-event.EventTarget
         * @param {Object} [context] 初始化的数据
         * @constructor
         */
        var exports = {};

        exports.constructor = function (context) {
            this.store = {};
            this.pendingWorkers = [];

            if (context) {
                this.fill(context, SILENT);
            }

            this.initialize();
        };

        exports.initialize = util.noop;

        /**
         * 移除一个已完成的工作对象
         *
         * @param {Model} model 当前的`Model`对象
         * @param {meta.Promise} worker 工作对象
         * @ignore
         */
        function removePendingWorker(model, worker) {
            for (var i = 0; i < model.pendingWorkers.length; i++) {
                if (model.pendingWorkers[i] === worker) {
                    model.pendingWorkers.splice(i, 1);
                    return;
                }
            }
        }

        /**
         * 添加一个未完成的工作对象
         *
         * 将一个{@link meta.Promise}对象添加到当前的{@link Model}对象上，
         * 则当此{@link meta.Promise}对象进入`resolved或`rejected`状态后，会自动移除
         *
         * 而未移除的这些{@link meta.Promise}对象，会在当前{@link Model}对象销毁果，
         * 一并进行销毁。一个{@link meta.Promise}对象如果额外提供`abort()`方法，
         * 则调用此方法进行销毁，其它情况下直接丢弃
         *
         * @param {meta.Promise} worker 工作对象
         */
        exports.addPendingWorker = function (worker) {
            this.pendingWorkers.push(worker);
            worker.ensure(util.bind(removePendingWorker, null, this, worker));
        };

        /**
         * 当前Model的数据源
         *
         * 数据源是对数据一系列配置，其中保存了多个数据的获取函数，有以下方式
         *
         * - 单一数据源配置
         *
         *     如果`datasource`是一个函数，则认为该函数是一个数据获取函数，
         *     执行该函数，并把返回值按照一个对象放到当前{@link Model}中
         *
         *         // 配置从指定的URL获取数据
         *         datasource = require('./datasource').remote('/model/list')
         *
         * - 并发请求数据
         *
         *     通过一个对象配置并发的数据获取。对象中每一个属性对应一个获取函数，
         *     当数据获取后，会调用`this.set(name, result)`，以属性名为键值添加
         *
         *         // 并发请求多个URL
         *         datasource = {
         *             'list': require('./datasource').remote('/model/list'),
         *             'config': require('./datasource').constant('listConfig')
         *         };
         *
         * - 串行请求数据
         *
         *     通过一个数组配置并发的数据获取，数组中包含对象。将按照数组的顺序，
         *     依次加载每一个对象（对象中的各属性是并发）
         *
         *         // 串行请求几个URL
         *         datasource = [
         *             { 'config': require('./datasource').constant('config') },
         *             { 'list': require('./datasource').remote('/model/list') }
         *         ];
         *
         *     注意使用该方案时，各对象中的键 **不要相同** ，否则会造成数据的覆盖
         *
         * - 嵌套配置
         *
         *     数组和对象可以相互嵌套，但有一个限制：
         *
         *     > 当一个对象中某个属性的值为普通对象（非数据加载配置项）或数组时，
         *     > 该属性名将不起作用，即不会在{@link Model}对象中存在以该属性名为键的值
         *
         *     以下为一个串行和并行混杂的数据源配置：
         *
         *         datasource = {
         *             'one': [getX, getY, getZ],
         *             'two': getA,
         *             'three': [
         *                 { 'four': getB },
         *                 { 'five': getC }
         *             ]
         *         };
         *
         *     以上对象将在最终的{@link Model}对象中生成`two`、`four`和`five`属性，
         *     而`one`、`two`和`three`因为属性值为普通对象或数组，将被忽略，
         *     其中`one`对应3个函数，将会把函数的返回值展开后添加到当前{@link Model}
         *
         *     同样，注意在嵌套的同时，各属性名 **不要相同** ，除非该属性名称没用，
         *     以避免出现数据相互覆盖的情况
         *
         * 通过数据获取配置项
         *
         * 上文所述的各种方案，均是数据获取配置项的简写，
         * 一个数据获取配置项的结构请参考{@link meta.DatasourceOption}的说明
         *
         * 因此，可以使用数据获取配置项来处理一些例外情况，比如并行加载2个对象，
         * 且2个对象均无对应的键值，需要完整添加到`Model`对象：
         *
         *     // 并行加载对象并完整添加到`Model`对象
         *     datasource = [
         *         {
         *             retrieve: require('./datasource').remote('/model/list'),
         *             dump: true
         *         },
         *         {
         *             retrieve: require('./datasource').remote('/user/info'),
         *             dump: true
         *         }
         *     ];
         *
         * 对于不同的简写，其与数据获取配置项的对应关系如下：
         *
         * - 普通的函数，映射为`{ retrieve: {fn}, dump: true }`
         * - 对象中的一个属性，映射为`{ retrieve: {fn}, name: {name} }`
         *
         * @type {Object | Array | Function}
         * @protected
         */
        exports.datasource = null;

        /**
         * 获取数据源配置，默认直接返回{@link Model#datasource}属性
         *
         * @return {Object | Array | Function}
         */
        exports.getDatasource = function () {
            return this.datasource;
        };

        function forwardToPrepare() {
            function processError(ex) {
                var error = {
                    success: false,
                    name: '$prepare',
                    options: {},
                    error: ex
                };
                throw error;
            }

            try {
                var preparing = this.prepare();
                if (Deferred.isPromise(preparing)) {
                    return preparing.fail(processError);
                }
                else {
                    return preparing;
                }
            }
            catch (ex) {
                processError(ex);
            }
        }

        /**
         * 加载当前{@link Model}对象的数据
         *
         * @return {meta.Promise} 返回一个{@link meta.Promise}对象，
         * 在数据加载且{@link Model#prepare}方法执行后进入`resolved`状态，
         * 如果加载过程中出现错误，则进入`rejected`状态
         */
        exports.load = function () {
            try {
                var datasource = this.getDatasource();
                var loading = load(this, datasource);
                return loading.then(util.bind(forwardToPrepare, this));
            }
            catch (ex) {
                return Deferred.rejected(ex);
            }
        };

        /**
         * 处理加载后的数据
         *
         * 这个方法用于在{@link Model#load}完毕后，调整一些数据结构
         *
         * 在该方法执行时，当前的{@link Model}对象中
         * 已经有{@link Model#load}方法填充的数据，
         * 可使用{@link Model#get}、{@link Model#set}和{@link Model#remove}
         * 方法对数据进行调整
         *
         * 该方法默认不执行任何逻辑
         *
         * 如果在`prepare`方法中有异步的操作，
         * 可以让方法返回一个{@link meta.Promise}对象，
         * {@link Model#load}方法会等待其进入`resolved状态
         *
         * @return {meta.Promise | undefined} 如果`prepare`的逻辑中有异步操作，
         * 则返回一个{@link meta.Promise}对象，通知调用者等待
         * @protected
         */
        exports.prepare = util.noop;

        /**
         * 获取对应键的值
         *
         * @param {string} name 属性名
         * @return {Mixed} `name`对应的值
         */
        exports.get = function (name) {
            return this.store[name];
        };

        /**
         * 设置单个属性值
         *
         * @param {Model} model 作为容器的Model对象
         * @param {string} name 属性名
         * @param {Mixed} value 对应的值
         * @return {meta.ChangeRecord} 一个变化记录项
         * @ignore
         */
        function setProperty(model, name, value) {
            var type = model.store.hasOwnProperty(name) ? 'change' : 'add';
            var oldValue = model.store[name];
            model.store[name] = value;

            // 只在新旧值不同的情况下才有变化记录项
            if (oldValue !== value) {
                return {
                    type: type,
                    name: name,
                    oldValue: oldValue,
                    newValue: value
                };
            }

            return null;
        }

        /**
         * 设置值
         *
         * @param {string} name 属性名
         * @param {Mixed} value 对应的值
         * @param {Object} [options] 相关选项
         * @param {boolean} [options.silent=false] 如果该值为`true`则不触发{@link Model#change}事件
         * @return {Mixed} 返回`value`对象
         * @fires change
         */
        exports.set = function (name, value, options) {
            options = options || {};

            var record = setProperty(this, name, value);
            if (record && !options.silent) {
                var event = {
                    changes: [record]
                };
                /**
                 * @event change
                 *
                 * 属性值发生变化时触发
                 *
                 * @param {meta.ChangeRecord[]} changes 发生变化的记录项
                 */
                this.fire('change', event);
            }

            return value;
        };

        /**
         * 批量设置值
         *
         * @param {Object} extension 批量值的存放对象
         * @param {Object} [options] 相关选项
         * @param {boolean} [options.silent=false] 如果该值为`true`则不触发{@link Model#change}事件
         * @return {Object} 返回`extension`对象
         * @fires change
         */
        exports.fill = function (extension, options) {
            options = options || {};

            var changes = [];
            for (var name in extension) {
                if (extension.hasOwnProperty(name)) {
                    var record = setProperty(this, name, extension[name]);
                    if (record) {
                        changes.push(record);
                    }
                }
            }

            if (changes.length && !options.silent) {
                var event = {
                    changes: changes
                };
                this.fire('change', event);
            }

            return extension;
        };

        /**
         * 删除对应键的值
         *
         * @param {string} name 属性名
         * @return {Mixed} 在删除前`name`对应的值
         * @param {Object} [options] 相关选项
         * @param {boolean} [options.silent=false] 如果该值为`true`则不触发{@link Model#change}事件
         * @fires change
         */
        exports.remove = function (name, options) {
            // 如果原来就没这个值，就不触发`change`事件了
            if (!this.store.hasOwnProperty(name)) {
                return;
            }

            options = options || {};
            var value = this.store[name];
            delete this.store[name];

            if (!options.silent) {
                var event = {
                    changes: [
                        {
                            type: 'remove',
                            name: name,
                            oldValue: value,
                            newValue: undefined
                        }
                    ]
                };
                this.fire('change', event);
            }

            return value;
        };

        /**
         * 获取对应键的值并组装为一个新的{@link Model}对象后返回
         *
         * @param {string} name 属性名
         * @return {Model} `name`对应的值组装成的新的{@link Model}对象
         */
        exports.getAsModel = function (name) {
            var value = this.get(name);
            if (!value || {}.toString.call(value) !== '[object Object]') {
                return new Model();
            }
            else {
                return new Model(value);
            }
        };

        /**
         * 将当前{@link Model}对象导出为一个普通的对象
         *
         * @return {Object} 一个普通的对象，修改该对象不会影响到当前{@link Model}对象
         */
        exports.dump = function () {
            // 为保证获取对象后修改不会影响到当前`Model`对象，
            // 需要做一次克隆的操作
            return util.mix({}, this.store);
        };

        /**
         * 判断当前{@link Model}对象是否有指定的属性
         *
         * @param {string} name 属性名
         * @return {boolean}
         */
        exports.has = function (name) {
            return this.store.hasOwnProperty(name);
        };

        /**
         * 判断当前{@link Model}对象是否有指定的属性且值不为`null`或`undefined`
         *
         * @param {string} name 属性名
         * @return {boolean}
         */
        exports.hasValue = function (name) {
            // 不要用`this.get`，有可能`Model`重写`get`还依赖这个方法
            return this.has(name) && this.store[name] != null;
        };

        /**
         * 判断当前{@link Model}对象是否有指定的属性
         * 且值不为`null`、`undefined`或空字符串
         *
         * @param {string} name 属性名
         * @return {boolean}
         */
        exports.hasReadableValue = function (name) {
            return this.hasValue(name) && this.store[name] !== '';
        };

        /**
         * 将当前{@link Model}对象导出为一个普通的对象
         *
         * @return {Object} 一个普通的对象，修改该对象不会影响到当前{@link Model}对象
         * @override
         * @deprecated 建议使用{@link Model#dump}方法
         */
        exports.valueOf = function () {
            return this.dump();
        };

        /**
         * 克隆当前{@link Model}对象，产生一个新的{@link Model}对象
         *
         * @return {Model} 克隆后的新{@link Model}对象
         */
        exports.clone = function () {
            return new Model(this.store);
        };

        /**
         * 处理加载过程中发生的错误
         *
         * 加载过程中的每一个错误都会调用该方法，该方法可以决定错误的处理逻辑：
         *
         * - 如果方法正常返回，则认为错误已经处理完毕，返回值作为数据值加入到当前Model中
         * - 如果方法抛出异常，则认为错误未经处理，将错误继续向上抛出，当前Model加载失败
         *
         * @param {Object} error 错误信息
         * @param {string} [error.name] 对应的数据键名
         * @param {Mixed} error.error 错误对象
         */
        exports.handleError = function (error) {
            throw error;
        };

        /**
         * 销毁当前{@link Model}对象，会尝试停止所有正在加载的数据
         */
        exports.dispose = function () {
            if (this.pendingWorkers) {
                for (var i = 0; i < this.pendingWorkers.length; i++) {
                    var worker = this.pendingWorkers[i];
                    if (typeof worker.abort === 'function') {
                        try {
                            worker.abort();
                        }
                        catch (ex) {
                        }
                    }
                }
                this.pendingWorkers = null;
            }
        };

        var Model = require('eoo').create(require('mini-event/EventTarget'), exports);

        return Model;
    }
);
