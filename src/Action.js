define(
    'Action',
    function(require) {
        var util = require('./util');
        var Observable = require('./Observable');

        /**
         * Action类声明
         * 
         * 在ER框架中，Action并不一定要继承该类，
         * 任何有一个名为`enter`的方法的对象均可作为Action
         * 
         * 该类制定了一个完整的Action的执行周期
         *
         * @constructor
         */
        function Action() {
            Observable.apply(this, arguments);
        }

        /**
         * 当前Action运行上下文
         *
         * @type {Object}
         */
        Action.prototype.context = null;

        /**
         * 指定渲染当前Action的DOM容器的id
         *
         * @type {string}
         */
        Action.prototype.container = null;

        /**
         * 指定对应的Model类型
         *
         * @type {function|null}
         */
        Action.prototype.modelType = null;

        /**
         * 指定对应的View类型
         *
         * @type {function|null}
         */
        Action.prototype.viewType = null;

        /**
         * 进入Action执行周期
         */
        Action.prototype.enter = function(context) {
            this.fire('enter');

            this.context = context;

            var args = util.mix({}, context, context.url.getQuery());

            this.model = this.createModel(args);
            if (this.model && typeof this.model.load === 'function') {
                var loadingModel = this.model.load();
                loadingModel.done(util.bindFn(this.forwardToView, this));
            }
            else {
                this.forwardToView();
            }
        };

        /**
         * 创建对应的Model对象
         */
        Action.prototype.createModel = function(context) {
            return this.modelType ? new this.modelType(context) : {};
        };

        /**
         * 加载完Model后，进入View相关的逻辑
         */
        Action.prototype.forwardToView = function() {
            this.fire('modelloaded');

            this.view = this.createView();
            if (this.view) {
                this.view.model = this.model;
                this.view.container = this.context.container;
                this.fire('beforerender');
                this.view.render();
                this.fire('rendered');

                this.initBehavior();
                this.fire('entercomplete');
            }
            else {
                throw new Error('No view attached to this action');
            }
        };

        /**
         * 创建对应的View对象
         */
        Action.prototype.createView = function() {
            return this.viewType ? new this.viewType() : null;
        };

        /**
         * 处理与View相关的交互逻辑
         */
        Action.prototype.initBehavior = function() {
        };

        /**
         * 离开当前Action，清理Model和View
         */
        Action.prototype.leave = function() {
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

            this.fire('leave');
        };

        util.inherits(Action, Observable);
        return Action;
    }
);