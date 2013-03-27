/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 简易的、基于html注释的模板支持
 * @author erik, mytharcher, otakustay
 * 
 * @example
 *     <!-- target: targetName -->
 *     <div>html fragment</div>
 *     
 *     <!-- target: targetName2( master = masterName ) -->
 *     <!-- content: header -->
 *     title
 *     <!-- content: content -->
 *     <ul>
 *         <!-- for: ${list} as ${item} -->
 *         <li>${item} 
 *         <!-- /for -->
 *     </ul>
 *     
 *     <!-- master: masterName -->
 *     <div class="header">
 *         <!-- contentplaceholder: header -->
 *     </div>
 *     <div class="content">
 *         <!-- contentplaceholder: content -->
 *     </div>
 */


// 这货是个状态机，所以特别放开一些限制
/*jshint maxdepth: 10, unused: false, white: false */

/**
 * 简易的模板解析器
 */
define(
    function (require) {
        var util = require('./util');

        /**
         * 随手写了个栈
         *
         * @inner
         */
        function Stack() {
            this.container = [];
            this.index = -1;
        }

        Stack.prototype = {
            /**
             * 获取栈顶元素
             *
             * @return {Any}
             */
            current: function () {
                return this.container[this.index];
            },

            /**
             * 入栈
             *
             * @param {Any} elem
             */
            push: function (elem) {
                this.container[++this.index] = elem;
            },

            /**
             * 出栈
             *
             * @return {Any}
             */
            pop: function () {
                if (this.index < 0) {
                    return null;
                }

                var elem = this.container[this.index];
                this.container.length = this.index--;

                return elem;
            },

            /**
             * 获取栈底元素
             *
             * @return {Any}
             */
            bottom: function () {
                return this.container[0];
            }
        };

        /**
         * 随手写了个数组作为buffer
         *
         * @inner
         */
        function ArrayBuffer() {
            this.raw = [];
            this.idx = 0;
        }

        ArrayBuffer.prototype = {
            /**
             * 添加元素到数组末端
             *
             * @param {Any} elem 添加项
             */
            push: function (elem) {
                this.raw[this.idx++] = elem;
            },

            /**
             * 添加多个元素到数组末端
             */
            pushMore: function () {
                for (var i = 0, l = arguments.length; i < l; i++) {
                    this.push(arguments[i]);
                }
            },

            /**
             * 连接数组项
             *
             * @param {string} split 分隔串
             * @return {string}
             */
            join: function (split) {
                return this.raw.join(split);
            },

            /**
             * 获取源数组
             *
             * @return {Array}
             */
            getRaw: function () {
                return this.raw;
            }
        };

        /**
         * 随手写了个节点迭代器
         *
         * @inner
         * @param {Array} stream 节点流
         */
        function NodeIterator(stream) {
            this.stream = stream;
            this.index = 0;
        }

        NodeIterator.prototype = {
            /**
             * 下一节点
             *
             * @return {Object}
             */
            next: function () {
                return this.stream[++this.index];
            },

            /**
             * 上一节点
             *
             * @return {Object}
             */
            prev: function () {
                return this.stream[--this.index];
            },

            /**
             * 当前节点
             *
             * @return {Object}
             */
            current: function () {
                return this.stream[this.index];
            }
        };

        function Scope(parent) {
            this._store = {};
            this.parent = parent;
        }

        Scope.prototype = {
            get: function (name) {
                var value = this._store[name];
                if (value == null && this.parent) {
                    return this.parent.get(name);
                }

                if (value != null) {
                    return value;
                }

                return null;
            },

            set: function (name, value) {
                this._store[name] = value;
            }
        };

        // 节点类型声明
        var TYPE = {
            TEXT: 1,
            TARGET: 2,
            MASTER: 3,
            IMPORT: 4,
            CONTENT: 5,
            CONTENTPLACEHOLDER: 6,
            FOR: 7,
            IF: 8,
            ELIF: 9,
            ELSE: 10
        };

        // 命令注释规则
        var COMMENT_RULE = /^\s*(\/)?([a-z]+)(.*)$/i;

        // 属性规则
        var PROP_RULE = /^\s*([0-9a-z_]+)\s*=\s*([0-9a-z_]+)\s*$/i;

        // FOR标签规则
        /*jshint maxlen: 120 */
        var FOR_RULE = /^\s*:\s*\$\{([0-9a-z_.\[\]]+)\}\s+as\s+\$\{([0-9a-z_]+)\}\s*(,\s*\$\{([0-9a-z_]+)\})?\s*$/i;

        // IF和ELIF标签规则
        var IF_RULE = /^\s*:([>=<!0-9a-z$\{\}\[\]\(\):\s'"\.\|&_]+)\s*$/i;

        // 普通命令标签规则
        var TAG_RULE = /^\s*:\s*([a-z0-9_]+)\s*(?:\(([^)]+)\))?\s*$/i;

        // 条件表达式规则
        /*jshint maxlen: 120 */
        var CONDEXPR_RULE = /\s*(\!=?=?|\|\||&&|>=?|<=?|===?|['"\(\)]|\$\{[^\}]+\}|\-?[0-9]+(\.[0-9]+)?)/;

        // target和master存储容器
        var masterContainer = {};
        var targetContainer = {};

        // 过滤器
        var filterContainer = {
            html: util.encodeHTML,
            url: encodeURIComponent
        };

        /**
         * 节点分析，返回节点流
         *
         * @inner
         * @return {Array}
         */
        function nodeAnalyse(source) {
            var COMMENT_BEGIN = '<!--';
            var COMMENT_END = '-->';

            var i;
            var len;
            var str;
            var strLen;
            var commentText;
            var nodeType;
            var nodeContent;
            var node;
            var propList;
            var propLen;

            // text节点内容缓冲区，用于合并多text
            var textBuf = new ArrayBuffer();

            // node结果流
            var nodeStream = new ArrayBuffer();

            // 对source以 <!-- 进行split
            var texts = source.split(COMMENT_BEGIN);
            if (texts[0] === '') {
                texts.shift();
            }

            /**
             * 将缓冲区中的text节点内容写入
             *
             * @inner
             */
            function flushTextBuf() {
                nodeStream.push({
                    type: TYPE.TEXT,
                    text: textBuf.join('')
                });
                textBuf = new ArrayBuffer();
            }

            /**
             * 抛出标签不合法错误
             *
             * @inner
             */
            function throwInvalid(type, text) {
                throw type + ' is invalid: ' + text;
            }

            /**
             * 注释作为普通注释文本写入流，不具有特殊含义
             *
             * @inner
             */
            function beCommentText(text) {
                textBuf.pushMore(COMMENT_BEGIN, text, COMMENT_END);
            }

            // 开始第一阶段解析，生成strStream
            for (i = 0, len = texts.length; i < len; i++) {
                // 对 <!-- 进行split的结果
                // 进行 --> split
                // 如果split数组长度为2
                // 则0项为注释内容，1项为正常html内容
                str = texts[i].split(COMMENT_END);
                strLen = str.length;

                if (strLen === 2 || i > 0) {
                    if (strLen === 2) {
                        commentText = str[0];
                        if (COMMENT_RULE.test(commentText)) {
                            // 将缓冲区中的text节点内容写入
                            flushTextBuf();

                            // 节点类型分析
                            nodeType = RegExp.$2.toLowerCase();
                            nodeContent = RegExp.$3;
                            node = {
                                type: TYPE[nodeType.toUpperCase()]
                            };

                            if (RegExp.$1) {
                                // 闭合节点解析
                                node.endTag = 1;
                                nodeStream.push(node);
                            }
                            else {
                                switch (nodeType) {
                                    case 'content':
                                    case 'contentplaceholder':
                                    case 'master':
                                    case 'import':
                                    case 'target':
                                        if (TAG_RULE.test(nodeContent)) {
                                            // 初始化id
                                            node.id = RegExp.$1;

                                            // 初始化属性
                                            propList = RegExp.$2.split(/\s*,\s*/);
                                            propLen = propList.length;
                                            while (propLen--) {
                                                var prop = propList[propLen];
                                                if (PROP_RULE.test(prop)) {
                                                    node[RegExp.$1] = RegExp.$2;
                                                }
                                            }
                                        }
                                        else {
                                            throwInvalid(nodeType, commentText);
                                        }
                                        break;
                                    case 'for':
                                        if (FOR_RULE.test(nodeContent)) {
                                            node.list = RegExp.$1;
                                            node.item = RegExp.$2;
                                            node.index = RegExp.$4;
                                        }
                                        else {
                                            throwInvalid(nodeType, commentText);
                                        }
                                        break;
                                    case 'if':
                                    case 'elif':
                                        if (IF_RULE.test(RegExp.$3)) {
                                            node.expr = 
                                                condExpr.parse(RegExp.$1);
                                        }
                                        else {
                                            throwInvalid(nodeType, commentText);
                                        }
                                        break;
                                    case 'else':
                                        break;
                                    default:
                                        node = null;
                                        beCommentText(commentText);
                                }

                                node && nodeStream.push(node);
                            }
                        }
                        else {
                            // 不合规则的注释视为普通文本
                            beCommentText(commentText);
                        }

                        textBuf.push(str[1]);
                    }
                    else {
                        textBuf.push(str[0]);
                    }
                }
            }


            flushTextBuf(); // 将缓冲区中的text节点内容写入
            return nodeStream.getRaw();
        }

        /**
         * 语法分析
         *
         * @inner
         * @param {Array} stream 构造单元流
         */
        var syntaxAnalyse = (function () {
            var astParser = {};
            var targetCache;
            var masterCache;
            var analyseStack;
            var nodeIterator;

            /**
             * 弹出node
             *
             * @inner
             * @param {number} stopType 遇见则终止弹出的类型
             */
            function popNode(stopType) {
                var current;

                while ((current = analyseStack.current()) 
                    && current.type !== stopType
                ) {
                    analyseStack.pop();
                }

                return analyseStack.pop();
            }

            /**
             * 压入node
             *
             * @inner
             * @param {Object} node 节点
             */
            function pushNode(node) {
                analyseStack.push(node);
            }

            /**
             * 获取错误提示信息
             *
             * @inner
             * @return {string}
             */
            function getError() {
                var node = analyseStack.bottom;
                return '[er template]' + node.type + ' ' + node.id 
                    + ': unexpect ' + nodeIterator.current().type 
                    + ' on ' + analyseStack.current().type;
            }

            /**
             * 根据类型解析抽象树
             *
             * @inner
             * @param {number} type 节点类型
             */
            function astParseByType(type) {
                var parser = astParser[type];
                parser && parser();
            }

            /**
             * target解析
             *
             * @inner
             */
            astParser[TYPE.TARGET] = function () {
                var node = nodeIterator.current();
                node.block = [];
                node.content = {};

                pushNode(node);
                targetCache[node.id] = node;

                while ((node = nodeIterator.next())) {
                    switch (node.type) {
                        case TYPE.TARGET:
                        case TYPE.MASTER:
                            popNode();
                            if (!node.endTag) {
                                nodeIterator.prev();
                            }
                            return;
                        case TYPE.CONTENTPLACEHOLDER:
                        case TYPE.
                            ELSE:
                        case TYPE.ELIF:
                            throw getError();
                        default:
                            astParseByType(node.type);
                            break;
                    }
                }
            };

            /**
             * master解析
             *
             * @inner
             */
            astParser[TYPE.MASTER] = function () {
                var node = nodeIterator.current();
                node.block = [];

                pushNode(node);
                masterCache[node.id] = node;

                while ((node = nodeIterator.next())) {
                    switch (node.type) {
                        case TYPE.TARGET:
                        case TYPE.MASTER:
                            popNode();
                            if (!node.endTag) {
                                nodeIterator.prev();
                            }
                            return;
                        case TYPE.CONTENT:
                        case TYPE.
                            ELSE:
                        case TYPE.ELIF:
                            throw getError();
                        default:
                            astParseByType(node.type);
                            break;
                    }
                }
            };

            /**
             * text解析
             *
             * @inner
             */
            astParser[TYPE.TEXT] =

            /**
             * import解析
             *
             * @inner
             */
            astParser[TYPE.IMPORT] =

            /**
             * contentplaceholder解析
             *
             * @inner
             */
            astParser[TYPE.CONTENTPLACEHOLDER] = function () {
                analyseStack.current()
                    .block.push(nodeIterator.current());
            };

            /**
             * content解析
             *
             * @inner
             */
            astParser[TYPE.CONTENT] = function () {
                var node = nodeIterator.current();
                node.block = [];

                analyseStack.bottom()
                    .content[node.id] = node;
                pushNode(node);

                while ((node = nodeIterator.next())) {
                    if (node.endTag) {
                        if (node.type === TYPE.CONTENT) {
                            popNode(TYPE.CONTENT);
                        } else {
                            nodeIterator.prev();
                        }
                        return;
                    }

                    switch (node.type) {
                        case TYPE.TARGET:
                        case TYPE.MASTER:
                            popNode();
                            nodeIterator.prev();
                            return;
                        case TYPE.CONTENTPLACEHOLDER:
                        case TYPE.
                            ELSE:
                        case TYPE.ELIF:
                            throw getError();
                        case TYPE.CONTENT:
                            popNode(TYPE.CONTENT);
                            nodeIterator.prev();
                            return;
                        default:
                            astParseByType(node.type);
                            break;
                    }
                }
            };

            /**
             * for解析
             *
             * @inner
             */
            astParser[TYPE.FOR] = function () {
                var node = nodeIterator.current();
                node.block = [];

                analyseStack.current()
                    .block.push(node);
                pushNode(node);

                while ((node = nodeIterator.next())) {
                    if (node.endTag) {
                        if (node.type === TYPE.FOR) {
                            popNode(TYPE.FOR);
                        } else {
                            nodeIterator.prev();
                        }
                        return;
                    }

                    switch (node.type) {
                        case TYPE.TARGET:
                        case TYPE.MASTER:
                            popNode();
                            nodeIterator.prev();
                            return;
                        case TYPE.CONTENTPLACEHOLDER:
                        case TYPE.CONTENT:
                        case TYPE.
                            ELSE:
                        case TYPE.ELIF:
                            throw getError();
                        default:
                            astParseByType(node.type);
                            break;
                    }
                }
            };

            /**
             * if解析
             *
             * @inner
             */
            astParser[TYPE.IF] = function () {
                var node = nodeIterator.current();
                node.block = [];

                analyseStack.current()
                    .block.push(node);
                pushNode(node);

                while ((node = nodeIterator.next())) {
                    if (node.endTag) {
                        if (node.type === TYPE.IF) {
                            popNode(TYPE.IF);
                        }
                        else {
                            nodeIterator.prev();
                        }
                        return;
                    }

                    switch (node.type) {
                        case TYPE.TARGET:
                        case TYPE.MASTER:
                            popNode();
                            nodeIterator.prev();
                            return;
                        case TYPE.CONTENTPLACEHOLDER:
                        case TYPE.CONTENT:
                            throw getError();
                        default:
                            astParseByType(node.type);
                            break;
                    }
                }
            };

            /**
             * elif解析
             *
             * @inner
             */
            astParser[TYPE.ELIF] = function () {
                var node = nodeIterator.current();
                node.type = TYPE.IF;
                node.block = [];

                popNode(TYPE.IF)['else'] = node;
                pushNode(node);


                while ((node = nodeIterator.next())) {
                    if (node.endTag) {
                        nodeIterator.prev();
                        return;
                    }

                    switch (node.type) {
                        case TYPE.TARGET:
                        case TYPE.MASTER:
                            popNode();
                            nodeIterator.prev();
                            return;
                        case TYPE.CONTENTPLACEHOLDER:
                        case TYPE.CONTENT:
                            throw getError();
                        case TYPE.ELIF:
                            nodeIterator.prev();
                            return;
                        default:
                            astParseByType(node.type);
                            break;
                    }
                }
            };

            /**
             * else解析
             *
             * @inner
             */
            astParser[TYPE.
            ELSE] = function () {
                var unit = nodeIterator.current();
                var node = analyseStack.current();
                var nodeType;

                while (1) {
                    nodeType = node.type;
                    if (nodeType === TYPE.IF || nodeType === TYPE.ELIF) {
                        node = {
                            type: TYPE.
                            ELSE,
                            block: []
                        };
                        analyseStack.current()['else'] = node;
                        break;
                    }

                    node = analyseStack.pop();
                }
                pushNode(node);

                while ((unit = nodeIterator.next())) {
                    if (unit.endTag) {
                        nodeIterator.prev();
                        return;
                    }

                    switch (unit.type) {
                        case TYPE.TARGET:
                        case TYPE.MASTER:
                            popNode();
                            nodeIterator.prev();
                            return;
                        case TYPE.CONTENTPLACEHOLDER:
                        case TYPE.CONTENT:
                        case TYPE.
                            ELSE:
                        case TYPE.ELIF:
                            throw getError();
                        default:
                            astParseByType(unit.type);
                            break;
                    }
                }
            };

            return function (stream) {
                var unit;
                var key;
                var target;
                var master;
                var content;
                var block;
                var masterBlock;
                var i, len, item;

                // 初始化解析用到的环境
                nodeIterator = new NodeIterator(stream);
                targetCache = {};
                masterCache = {};
                analyseStack = new Stack();

                // 解析node流成抽象树结构
                while ((unit = nodeIterator.current())) {
                    switch (unit.type) {
                        case TYPE.TARGET:
                        case TYPE.MASTER:
                            astParser[unit.type]();
                            break;
                        default:
                            nodeIterator.next();
                    }
                }

                // 将master从临时结果转移到container
                for (key in masterCache) {
                    if (masterContainer[key]) {
                        throw 'master "' + key + '" is exist!';
                    }

                    masterContainer[key] = masterCache[key];
                }

                // 链接 target 和 master
                // 将target从临时结果转移到container
                for (key in targetCache) {
                    if (targetContainer[key]) {
                        throw 'target "' + key + '" is exist!';
                    }

                    target = targetCache[key];
                    master = target.master;
                    targetContainer[key] = target;

                    if (master) {
                        block = [];
                        target.block = block;

                        master = masterContainer[master];
                        if (!master) {
                            continue;
                        }
                        masterBlock = master.block;

                        for (i = 0, len = masterBlock.length; i < len; i++) {
                            item = masterBlock[i];

                            if (item.type === TYPE.CONTENTPLACEHOLDER) {
                                content = target.content[item.id];
                                if (content) {
                                    block.push.apply(block, content.block);
                                }
                            }
                            else {
                                block.push(item);
                            }
                        }
                    }
                }

                // 释放解析所需的公共环境
                targetCache = null;
                masterCache = null;
                nodeIterator = null;
                analyseStack = null;
            };
        }());

        /**
         * 条件表达式解析和执行
         *
         * @inner
         */
        var condExpr = (function () {
            // 表达式类型
            var EXPR_T = {
                or: 1,
                and: 2,
                relation: 3,
                unary: 4,
                string: 5,
                number: 6,
                variable: 7,
                punc: 8
            };

            return {
                /**
                 * 解析条件表达式
                 *
                 * @inner
                 * @param {string} source 表达式源
                 */
                parse: function (source) {
                    source = util.trim(source);
                    var arr;
                    var str;
                    var expr;
                    var src = source;
                    var stream = [];

                    // 分析表达式token流
                    while (source) {
                        // 匹配一个含义块
                        arr = CONDEXPR_RULE.exec(source);
                        if (!arr) {
                            throw 'conditional expression invalid: ' + src;
                        }

                        // 更新未解析的源
                        source = source.slice(arr[0].length);
                        str = arr[1];

                        if (str.indexOf('$') === 0) {
                            stream.push({
                                type: EXPR_T.variable,
                                text: str.slice(2, str.length - 1)
                            });
                        }
                        else if (/^[-0-9]/.test(str)) {
                            stream.push({
                                type: EXPR_T.number,
                                text: str
                            });
                        }
                        else {
                            switch (str) {
                                case '\'':
                                case '"':
                                    var strBuf = [str];
                                    var cha;
                                    var index = 0;

                                    while (1) {
                                        cha = source.charAt(index++);
                                        if (cha === str) {
                                            strBuf.push(str);
                                            source = source.slice(index);
                                            break;
                                        }

                                        strBuf.push(cha);
                                    }
                                    stream.push({
                                        type: EXPR_T.string,
                                        text: strBuf.join('')
                                    });
                                    break;
                                default:
                                    stream.push({
                                        type: EXPR_T.punc,
                                        text: str
                                    });
                                    break;
                            }
                        }
                    }

                    // 分析表达式结构
                    expr = orExpr(new NodeIterator(stream));
                    return expr;
                },

                /**
                 * 运行条件表达式
                 *
                 * @inner
                 * @param {Object} expr 条件表达式
                 * @param {Scope} scope scope
                 * @return {boolean}
                 */
                exec: execCondExpr
            };

            /**
             * 解析and表达式
             *
             * @inner
             * @param {NodeIterator} iterator token迭代器
             * @description
             * andExpression:
             * relationalExpression
             * relationalExpression || andExpression
             */
            function andExpr(iterator) {
                var expr = relationExpr(iterator);
                var oper;
                if ((oper = iterator.current()) && oper.text === '&&') {
                    iterator.next();
                    expr = {
                        type: EXPR_T.and,
                        expr1: expr,
                        expr2: andExpr(iterator)
                    };
                }

                return expr;
            }

            /**
             * 解析or表达式
             *
             * @inner
             * @param {NodeIterator} iterator token迭代器
             * @description
             * orExpression:
             * andExpression
             * andExpression || orExpression
             */
            function orExpr(iterator) {
                var expr = andExpr(iterator);
                var oper;
                if ((oper = iterator.current()) && oper.text === '||') {
                    iterator.next();
                    expr = {
                        type: EXPR_T.or,
                        expr1: expr,
                        expr2: orExpr(iterator)
                    };
                }

                return expr;
            }

            /**
             * 解析primary表达式
             *
             * @inner
             * @param {NodeIterator} iterator token迭代器
             * @description
             * primaryExpression:
             * string
             * number
             * ( orExpression )
             */
            function primaryExpr(iterator) {
                var expr = iterator.current();
                if (expr.text === '(') {
                    iterator.next();
                    expr = orExpr(iterator);
                }

                iterator.next();
                return expr;
            }

            /**
             * 解析unary表达式
             *
             * @inner
             * @param {NodeIterator} iterator token迭代器
             * @description
             * unaryExpression:
             * primaryExpr
             * !primaryExpr
             */
            function unaryExpr(iterator) {
                if (iterator.current().text === '!') {
                    iterator.next();
                    return {
                        type: EXPR_T.unary,
                        oper: '!',
                        expr: primaryExpr(iterator)
                    };
                }

                return primaryExpr(iterator);
            }

            /**
             * 解析relational表达式
             *
             * @inner
             * @param {NodeIterator} iterator token迭代器
             * @description
             * relationalExpression:
             * unaryExpression
             * unaryExpression > unaryExpression
             * unaryExpression >= unaryExpression
             * unaryExpression < unaryExpression
             * unaryExpression <= unaryExpression
             * unaryExpression == unaryExpression
             * unaryExpression != unaryExpression
             * unaryExpression === unaryExpression
             * unaryExpression !== unaryExpression
             */
            function relationExpr(iterator) {
                var expr = unaryExpr(iterator);
                var oper;
                if ((oper = iterator.current()) && /^[><=]+$/.test(oper.text)) {
                    iterator.next();
                    expr = {
                        type: EXPR_T.relation,
                        expr1: expr,
                        expr2: unaryExpr(iterator),
                        oper: oper.text
                    };
                }

                return expr;
            }

            /**
             * 运行relational表达式
             *
             * @inner
             * @param {Object} expr relational表达式
             * @param {Scope} scope scope
             * @return {boolean}
             */
            function execRelationExpr(expr, scope) {
                var result1 = execCondExpr(expr.expr1, scope);
                var result2 = execCondExpr(expr.expr2, scope);

                switch (expr.oper) {
                    case '==':
                        /*jshint eqeqeq: false */
                        return result1 == result2;
                    case '===':
                        return result1 === result2;
                    case '>':
                        return result1 > result2;
                    case '<':
                        return result1 < result2;
                    case '>=':
                        return result1 >= result2;
                    case '<=':
                        return result1 <= result2;
                    case '!=':
                        return result1 != result2;
                    case '!==':
                        /*jshint eqeqeq: false */
                        return result1 !== result2;
                }
            }

            /**
             * 运行条件表达式
             *
             * @inner
             * @param {Object} expr 条件表达式
             * @param {Scope} scope scope
             * @return {Any}
             */
            function execCondExpr(expr, scope) {
                switch (expr.type) {
                    case EXPR_T.or:
                        return execCondExpr(expr.expr1, scope) 
                            || execCondExpr(expr.expr2, scope);
                    case EXPR_T.and:
                        return execCondExpr(expr.expr1, scope) 
                            && execCondExpr(expr.expr2, scope);
                    case EXPR_T.unary:
                        return !execCondExpr(expr.expr, scope);
                    case EXPR_T.relation:
                        return execRelationExpr(expr, scope);
                    case EXPR_T.string:
                    case EXPR_T.number:
                        return eval(expr.text);
                    case EXPR_T.variable:
                        return getVariableValue(scope, expr.text, 'raw');
                }
            }
        }());

        /**
         * 解析模板变量的值
         * 
         * @inner
         * @param {string} scope 
         * @param {string} varName 变量名
         * @param {string=} filterName 过滤器名
         * @return {string}
         */
        function getVariableValue(scope, varName, filterName) {
            varName = varName.split(/[\.\[]/);
            var variable = scope.get(varName[0]);
            varName.shift();

            for (var i = 0, len = varName.length; i < len; i++) {
                if (variable == null) {
                    break;
                }

                var propName = varName[i].replace(/\]$/, '');
                var propLen = propName.length;
                if (/^(['"])/.test(propName) 
                    && propName.lastIndexOf(RegExp.$1) === --propLen
                ) {
                    propName = propName.slice(1, propLen);
                }

                variable = variable[propName];
            }

            var value = '';
            if (variable != null) {
                value = variable;
            }

            // 过滤处理
            var filter = filterContainer[filterName || 'html'];
            filter && (value = filter(value));

            return value;
        }


        /**
         * 获取节点的内容
         *
         * @inner
         * @param {Object} node 节点
         * @return {string}
         */
        function getContent(node) {
            var block = node.block;
            var content = [];
            var item, i, len;

            for (i = 0, len = block.length; i < len; i++) {
                item = block[i];

                if (item.block) {
                    content.push(getContent(item));
                }
                else if (item.type === TYPE.IMPORT) {
                    content.push(getTargetContent(item.id));
                }
                else {
                    content.push(item.text || '');
                }
            }

            return content.join('');
        }

        /**
         * 获取target的内容
         *
         * @inner
         * @param {string} name target的名称
         * @return {string}
         */
        function getTargetContent(name) {
            try {
                var target = getTarget(name);
                return getContent(target) || '';
            }
            catch (ex) {
                return '';
            }
        }

        /**
         * 获取target
         *
         * @inner
         * @param {string} name target的名称
         * @return {Object}
         */
        function getTarget(name) {
            var target = targetContainer[name];
            if (!target) {
                throw 'target "' + name + '" is not exist!';
            }

            if (target.type !== TYPE.TARGET) {
                throw 'target "' + name + '" is invalid!';
            }

            return target;
        }

        /**
         * 替换模板变量的值
         * 
         * @inner
         * @param {string} text 替换文本源
         * @param {Scope} scope 
         * @return {string}
         */
        function replaceVariable(text, scope) {
            return text.replace(
                /\$\{([.a-z0-9\[\]'"_]+)\s*(\|([a-z]+))?\s*\}/ig,
                function ($0, $1, $2, $3) {
                    return getVariableValue(scope, $1, $3);
                }
            );
        }

        /**
         * 执行import
         * 
         * @inner
         * @param {Object} importStat import对象
         * @param {Scope} scope
         */
        function execImport(importStat, scope) {
            var target = getTarget(importStat.id);
            return exec(target, scope);
        }

        /**
         * 执行target
         * 
         * @inner
         * @param {Object} target 要执行的target
         * @param {Scope} scope
         */
        function exec(target, scope) {
            var result = [];
            var block = target.block;

            var stat, i, len;
            var forScope, forList, forI, forLen, forItem, forIndex;
            var ifValid;


            for (i = 0, len = block.length; i < len; i++) {
                stat = block[i];

                switch (stat.type) {
                    case TYPE.TEXT:
                        result.push(replaceVariable(stat.text, scope));
                        break;

                    case TYPE.IMPORT:
                        result.push(execImport(stat, scope));
                        break;

                    case TYPE.FOR:
                        forScope = new Scope(scope);
                        forList = scope.get(stat.list);
                        forItem = stat.item;
                        forIndex = stat.index;
                        for (forI = 0, forLen = forList.length; 
                            forI < forLen; 
                            forI++
                        ) {
                            forScope.set(forItem, forList[forI]);
                            forIndex && forScope.set(forIndex, forI);
                            result.push(exec(stat, forScope));
                        }
                        break;

                    case TYPE.IF:
                        ifValid = condExpr.exec(stat.expr, scope);
                        while (!ifValid) {
                            stat = stat['else'];
                            if (!stat) {
                                break;
                            }
                            ifValid = !stat.expr 
                                || condExpr.exec(stat.expr, scope);
                        }

                        stat && result.push(exec(stat, scope));
                        break;
                }
            }

            return result.join('');
        }

        /**
         * 解析模板
         *
         * @inner
         * @param {string} source 模板源
         */
        function parse(source) {
            var stream = nodeAnalyse(source);
            syntaxAnalyse(stream);
        }

        /**
         * 合并模板与数据
         * 
         * @inner
         * @param {HTMLElement} output 要输出到的容器元素
         * @param {string} tplName 模板名
         * @param {Model} model 获取数据的对象，实现`get({string}dataName):{*}`方法即可
         */
        function merge(output, tplName, model) {
            var html = '';
            var target;

            if (output) {
                try {
                    target = getTarget(tplName);
                    html = exec(target, new Scope(model));
                }
                catch (ex) {}

                output.innerHTML = html;
            }
        }

        // 返回暴露的方法
        var template = {
            /**
             * 添加过滤器
             * 
             * @public
             * @param {string} type 过滤器类型
             * @param {Function} filter 过滤器
             */
            addFilter: function (type, filter) {
                filterContainer[type] = filter;
            },

            /**
             * 获取指定模板target的HTML片段
             * 
             * @public
             * @param {string} name
             * @return {string}
             */
            get: getTargetContent,

            /**
             * 解析模板
             * 
             * @public
             * @param {string} source 模板源
             */
            parse: parse,

            /**
             * 合并模板与数据
             * 
             * @public
             * @param {HTMLElement} output 要输出到的容器元素
             * @param {string} tplName 视图模板
             * @param {Model} model 获取数据的对象，实现`get({string}dataName):{*}`方法即可
             */
            merge: merge
        };

        return template;
    }
);