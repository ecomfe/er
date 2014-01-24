/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file URL封装类
 * @author otakustay
 */
define(
    function (require) {
        var util = require('./util');

        /**
         * URL信息类
         *
         * 该类是一个不可变类型，构建后可以读取其中的内容，但不能修改
         * 
         * **不建议** 使用该类的构造函数，
         * 如果需要获得URL实例，通过`parse`和`withQuery`工厂方法生成
         * 
         * 该类的默认规则不同于普通的URL协议，具体体现如下：
         * 
         * - 不分解protocol、host、port、hash部分，仅包含path和search
         * - path和search的分隔符默认为`~`字符
         * 
         * @param {string} [path] URL中的path部分
         * @param {string} [search] URL中的search部分
         * @param {string} [searchSeparator="~"] 分隔path与search的分隔符
         * @constructor
         */
        function URL(path, search, searchSeparator) {
            path = path || '/';
            search = search || '';
            searchSeparator = searchSeparator || '~';

            /**
             * @method toString
             *
             * 获取完整URL字符串
             *
             * @return {string} 当前URL的完整字符串表示
             * @override
             */
            this.toString = function () {
                return search ? (path + searchSeparator + search) : path;
            };

            /**
             * @method getPath
             *
             * 获取path部分
             *
             * @return {string} URL中的path部分
             */
            this.getPath = function () {
                return path;
            };

            /**
             * @method getSearch
             *
             * 获取search部分
             *
             * @return {string} URL中的search部分
             */
            this.getSearch = function () {
                return search;
            };

            var query = null;

            /**
             * @method getQuery
             *
             * 获取参数对象或指定参数的值
             * 
             * @param {string} [key] 指定参数的名称，不传该参数则返回整个参数对象
             * @return {string | Object} 如果有`key`参数则返回对应值，
             * 否则返回参数对象的副本
             */
            this.getQuery = function (key) {
                if (!query) {
                    query = URL.parseQuery(search);
                }
                return key ? query[key] : util.mix({}, query);
            };
        }

        /**
         * 对比2个URL的差异
         *
         * @param {string | URL} another 另一个URL
         * @return {meta.URLDifference}
         */
        URL.prototype.compare = function (another) {
            if (typeof another === 'string') {
                another = URL.parse(another);
            }

            var result = {};

            var thisPath = this.getPath();
            var anotherPath = another.getPath();
            if (thisPath === anotherPath) {
                result.path = false;
            }
            else {
                result.path = {
                    key: 'path',
                    self: thisPath,
                    other: anotherPath
                };
            }

            var thisQuery = this.getQuery();
            var anotherQuery = another.getQuery();
            var queryDifferenceIndex = {};
            var queryDifference = [];
            var hasQueryDifference = false;
            for (var key in thisQuery) {
                if (thisQuery.hasOwnProperty(key)) {
                    var thisValue = thisQuery[key];
                    var anotherValue = anotherQuery[key];
                    if (thisValue !== anotherValue) {
                        hasQueryDifference = true;
                        var diff = {
                            key: key,
                            self: thisValue,
                            other: anotherValue
                        };
                        queryDifference.push(diff);
                        queryDifferenceIndex[key] = diff;
                    }
                }
            }
            // 再把`another`有的自身没有的加进去
            for (var key in anotherQuery) {
                if (anotherQuery.hasOwnProperty(key)
                    && !thisQuery.hasOwnProperty(key)
                ) {
                    hasQueryDifference = true;
                    var diff = {
                        key: key,
                        self: undefined,
                        other: anotherQuery[key]
                    };
                    queryDifference.push(diff);
                    queryDifferenceIndex[key] = diff;
                }
            }
            result.queryDifference = queryDifference;
            result.query = hasQueryDifference ? queryDifferenceIndex : false;

            return result;
        };

        /**
         * 解析完整的URL
         * 
         * 该函数仅解析`path`、`search`和`query`
         *
         * @param {string} url 完整的URL
         * @param {Object} [options] 控制解析行为的相关参数
         * @param {string} [options.querySeparator="~"] 用于分隔path和search的字符
         * @return {URL} 一个URL对象
         * @static
         */
        URL.parse = function (url, options) {
            var defaults = { querySeparator: '~' };
            options = util.mix(defaults, options);

            // 考虑到未转义的参数的影响，此处不使用`split`函数
            var querySeparatorIndex = url.indexOf(options.querySeparator);
            if (querySeparatorIndex >= 0) {
                return new URL(
                    url.slice(0, querySeparatorIndex),
                    url.slice(querySeparatorIndex + 1),
                    options.querySeparator
                );
            }
            else {
                return new URL(url, '', options.querySeparator);
            }
        };

        /**
         * 根据`path`和给定的`query`对象生成URL对象
         *
         * @param {string | URL} path 已经存在的URL
         * @param {Object} query URL的参数对象
         * @param {Object} [options] 控制解析行为的相关参数
         * @param {string} [options.querySeparator="~"] 用于分隔path和search的字符
         * @return {URL} 一个URL对象
         * @static
         */
        URL.withQuery = function (path, query, options) {
            path = path + '';
            var defaults = { querySeparator: '~' };
            options = util.mix(defaults, options);

            var separator = path.indexOf(options.querySeparator) < 0 
                ? options.querySeparator 
                : '&';
            var search = URL.serialize(query);
            var url = path + separator + search;

            return URL.parse(url, options);
        };

        /**
         * 根据`query`规则解析字符串并返回参数对象
         *
         * @param {string} str query字符串， *不能* 有起始的`?`或`#`字符
         * @return {Object} 从`str`解析得到的参数对象
         * @static
         */
        URL.parseQuery = function (str) {
            var pairs = str.split('&');
            var query = {};
            for (var i = 0; i < pairs.length; i++) {
                // 考虑到有可能因为未处理转义问题，
                // 导致value中存在**=**字符，因此不使用`split`函数
                var pair = pairs[i];
                if (!pair) {
                    continue;
                }
                var index = pair.indexOf('=');
                // 没有**=**字符则认为值是**true**
                var key = index < 0
                    ? decodeURIComponent(pair)
                    : decodeURIComponent(pair.slice(0, index));
                var value = index < 0
                    ? true
                    : decodeURIComponent(pair.slice(index + 1));

                // 已经存在这个参数，且新的值不为空时，把原来的值变成数组
                if (query.hasOwnProperty(key)) {
                    if (value !== true) {
                        query[key] = [].concat(query[key], value);
                    }
                }
                else {
                    query[key] = value;
                }
            }
            return query;
        };

        /**
         * 将参数对象转换为URL字符串
         *
         * @param {Object} query 参数对象
         * @return {string} 转换后的URL字符串，相当于`search`部分
         * @static
         */
        URL.serialize = function (query) {
            if (!query) {
                return '';
            }

            var search = '';
            for (var key in query) {
                if (query.hasOwnProperty(key)) {
                    var value = query[key];
                    // 如果`value`是数组，其`toString`会自动转为逗号分隔的字符串
                    search += '&' + encodeURIComponent(key) 
                        + '=' + encodeURIComponent(value);
                }
            }

            return search.slice(1);
        };

        /**
         * 空的URL实例，用于减少对`new URL()`的调用
         *
         * @type {URL}
         * @static
         */
        URL.empty = new URL();

        return URL;
    }
);
