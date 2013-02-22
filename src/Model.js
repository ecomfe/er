/**
 * ER (Enterprise RIA)
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * @file Model类声明
 * @author otakustay
 */
define(
    'Model',
    function(require) {
        /**
         * 加载一个数据
         *
         * @param {Model} model 用于存放数据的`Model`对象
         * @param {Object} options 数据获取配置项，详见`load`方法说明
         * @param {function} options.retrieve 获取数据的函数
         * @param {string=} options.key 获取数据后添加到`Model`对象时的键名
         * @param {boolean=} options.dump 决定数据是否完整添加到`Model`对象
         * @return {Promise} 对应的`Promise`对象，数据加载完成后触发
         */
        function loadData(model, options) {
            var value = options.retrieve(model);
            var Deferred = require('./Deferred');

            if (Deferred.isPromise(value)) {
                var util = require('./util');
                var addDataToModel = options.dump
                    ? util.bindFn(model.set, model)
                    : util.bindFn(model.set, model, options.key);
                value.done(addDataToModel);
                return value;
            }
            else {
                if (options.dump) {
                    model.set(value);
                }
                else {
                    model.set(options.key, value);
                }
                return Deferred.resolved();
            }
        }

        /**
         * 按顺序加载一个数组中的各项数据
         *
         * @param {Model} model 用于存放数据的`Model`对象
         * @param {Array} datasource 数据原配置
         * @return {Promise} 对应的`Promise`对象，数据加载完成后触发
         */ 
        function loadSequence(model, datasource) {
            // 第一个Promise是直接成功的，以便开始第一块的加载
            var Deferred = require('./Deferred');
            var loading = Deferred.resolved();
            for (var i = 0; i < datasource.length; i++) {
                var unit = datasource[i];
                var util = require('./util');
                var task = util.bindFn(load, null, model, unit);
                loading = loading.done(task);
            }
            return loading;
        }

        /**
         * 并行加载一批数据
         *
         * @param {Model} model 用于存放数据的`Model`对象
         * @param {Object} datasource 数据源配置
         * @return {Promise} 对应的`Promise`对象，数据加载完成后触发
         */
        function loadParallel(model, datasource) {
            var workers = [];
            for (var key in datasource) {
                if (datasource.hasOwnProperty(key)) {
                    var unit = datasource[key];

                    // 如果直接表达获取数据的内容（函数或数据获取配置项），
                    // 则需要加上对应的键名。
                    // 其它情况下（值为嵌套的数组或对象），键名将没有意义
                    if (typeof unit === 'function') {
                        unit = { retrieve: unit, key: key };
                    }
                    else if (typeof unit.retrieve === 'function') {
                        unit = require('./util').mix({ key: key }, unit);
                    }

                    workers.push(load(model, unit));
                }
            }

            var Deferred = require('./Deferred');
            return Deferred.join(workers);
        }

        /**
         * 根据数据源配置加载数据
         * 
         * 该函数处理所有数据项配置的情况
         *
         * @param {Model} model 用于存放数据的`Model`对象
         * @param {Object} datasource 数据源配置
         * @return {Promise} 对应的`Promise`对象，数据加载完成后触发
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

        var Observable = require('./Observable');

        /**
         * Model类声明
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
         * @constructor
         * @param {Object=} context 初始化的数据
         */
        function Model(context) {
            Observable.apply(this, arguments);

            this._store = {};

            if (context) {
                this.set(context);
            }
        }

        /**
         * 当前Model的数据源
         * 
         * 数据源是对数据一系列配置，其中保存了多个数据的获取函数，有以下方式
         * 
         * ### 单一数据源配置
         * 
         * 如果`datasource`是一个函数，则认为该函数是一个数据获取函数，
         * 执行该函数，并把返回值按照一个对象放到当前Model中
         * 
         *     // 配置从指定的URL获取数据
         *     datasource = require('./datasource').remote('/model/list')
         * 
         * ### 并发请求数据
         * 
         * 通过一个对象配置并发的数据获取。对象中每一个属性对应一个获取函数，
         * 当数据获取后，会调用`this.set(key, result)`，以属性名为键值添加
         * 
         *     // 并发请求多个URL
         *     datasource = {
         *         'list': require('./datasource').remote('/model/list'),
         *         'config': require('./datasource').constant('listConfig')
         *     };
         * 
         * ### 串行请求数据
         * 
         * 通过一个数组配置并发的数据获取，数组中包含对象。将按照数组的顺序，
         * 依次加载每一个对象（对象中的各属性是并发）
         * 
         *     // 串行请求几个URL
         *     datasource = [
         *         { 'config': require('./datasource').constant('config') },
         *         { 'list': require('./datasource').remote('/model/list') }
         *     ];
         * 
         * 注意使用该方案时，各对象中的键**不要相同**，否则会造成数据的覆盖
         * 
         * ### 嵌套配置
         * 
         * 数组和对象可以相互嵌套，但有一个限制：
         * 
         * > 当一个对象中某个属性的值为普通对象（非数据加载配置项）或数组时，
         * > 该属性名将不起作用，即不会在`Model`对象中存在以该属性名为键的值
         * 
         * 以下为一个串行和并行混杂的数据源配置：
         * 
         *     datasource = {
         *         'one': [getX, getY, getZ],
         *         'two': getA,
         *         'three': [
         *             { 'four': getB },
         *             { 'five': getC }
         *         ]
         *     };
         * 
         * 以上对象将在最终的`Model`对象中生成**two**、**four**和**five**属性，
         * 而**one**、**two**和**three**因为属性值为普通对象或数组，将被忽略，
         * 其中**one**对应3个函数，将会把函数的返回值完全展开后添加到当前`Model`
         * 
         * 同样，注意在嵌套的同时，各属性名**不要相同**，除非该属性名称没用，
         * 以避免出现数据相互覆盖的情况
         * 
         * ### 通过数据获取配置项
         * 
         * 上文所述的各种方案，均是数据获取配置项的一种简写，
         * 一个数据获取配置项包含以下内容：
         * 
         * - `key`：数据加载后添加到`Model`对象时用的键值
         * - `retrieve`：获取数据的函数
         * - `dump`：如果该值为**true**，则`key`配置无效，完整添加获取的对象
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
         * - 对象中的一个属性，映射为`{ retrieve: {fn}, key: {key} }`
         */
        Model.prototype.datasource = null;

        /**
         * 加载当前Model
         * 
         * @return {Promise} `Promise`对象，在数据加载且`prepare`方法执行后触发
         */
        Model.prototype.load = function() {
            var loading = load(this, this.datasource);
            var util = require('./util');
            loading.done(util.bindFn(this.prepare, this));
            return loading;

            // TODO: 加载中有一个或多个失败的时候如何处理（可直接静默）？
        };

        /**
         * 处理加载后的数据
         * 
         * 这个方法用于在`load`完毕后，调整一些数据结构
         * 
         * 在该方法执行时，`this`中已经有`load`方法填充的数据，
         * 可使用`get`、`set`和`remove`进行调整
         * 
         * 该方法默认不执行任何逻辑
         * 
         * 如果在`prepare`方法中有异步的操作，可以让方法返回一个`Promise`对象
         */
        Model.prototype.prepare = function() {
        };

        /**
         * 获取对应键的值
         *
         * @param {string} key 键名
         * @return {Any} `key`对应的值
         */
        Model.prototype.get = function(key) {
            return this._store[key];
        };

        /**
         * 设置值
         *
         * @param {string|Object} key 键名，如果是对象，则把对象里的每个键加入
         * @param {Any=} value 对应的值，如果`key`是对象，则没有此参数
         */
        Model.prototype.set = function(key, value) {
            if (arguments.length >= 2) {
                this._store[key] = value;
            }
            else {
                var extension = key;
                for (var name in extension) {
                    this.set(name, extension[name]);
                }
            }
        };

        /**
         * 删除对应键的值
         *
         * @param {string} key 键名
         * @return {Any} 在删除前`key`对应的值
         */
        Model.prototype.remove = function(key) {
            var value = this._store[key];
            delete this._store[key];
            return value;
        };

        /**
         * 获取对应键的值并组装为一个新的`Model`对象后返回
         *
         * @param {string} key 键名
         * @return {Model} `key`对应的值组装成的新的`Model`对象
         */
        Model.prototype.getAsModel = function(key) {
            var value = this.get(key);
            return new Model(value);
        };

        /**
         * 将当前`Model`对象展出为一个普通的对象
         *
         * @return {Object} 一个普通的对象，修改该对象不会影响到当前`Model`对象
         */
        Model.prototype.valueOf = function() {
            // 为保证`valueOf`获取对象后修改不会影响到当前`Model`对象，
            // 需要做一次克隆的操作
            var util = require('./util');
            return util.mix({}, this._store);
        };

        /**
         * 克隆当前`Model`对象，产生一个新的`Model`对象
         *
         * @return {Model} 克隆后的新`Model`对象
         */
        Model.prototype.clone = function() {
            return new Model(this._store);
        };

        require('./util').inherits(Model, Observable);

        return Model;
    }
);