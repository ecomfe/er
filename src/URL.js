/**
 * ER (Enterprise RIA)
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * @file URL封闭类
 * @author otakustay
 */
 define(
    'URL',
    function(require) {
        var util = require('./util');

        /**
         * URL信息类
         *
         * 该类是一个不可变类型，构建后可以读取其中的内容，但不能修改
         * 
         * **不建议**使用该类的构造函数，
         * 如果需要获得URL实例，通过`parse`和`withQuery`工厂方法生成
         * 
         * 该类的默认规则不同于普通的URL协议，具体体现如下：
         * 
         * - 不分解protocol、host、port、hash部分，仅包含path和search
         * - path和search的分隔符默认为**~**字符
         * 
         * @constructor
         * @param {string=} path URL中的path部分
         * @param {string=} search URL中的search部分
         * @param {string=} searchSeparator 分隔path与search的分隔符，默认为`~`
         */
        function URL(path, search, searchSeparator) {
            // TODO: 是否真的有必要用闭包+函数实现，直接暴露属性是不是也合理
            path = path || '/';
            search = search || '';
            searchSeparator = searchSeparator || '~';

            /**
             * 获取完整URL字符串
             */
            this.toString = function() {
                return search ? (path + searchSeparator + search) : path;
            };

            /**
             * 获取path部分
             */
            this.getPath = function() {
                return path;
            };

            /**
             * 获取search部分
             */
            this.getSearch = function() {
                return search;
            };

            var query = null;
            /**
             * 获取参数对象或指定参数的值
             * 
             * @param {string=} key 指定参数的名称，不传该参数则返回整个参数对象
             * @return {Any} 如果有`key`参数则返回对应值，否则返回参数对象的副本
             */
            this.getQuery = function(key) {
                if (!query) {
                    query = URL.parseQuery(search);
                }
                return key ? query[key] : util.mix({}, query);
            };
        }

        /**
         * 解析完整的URL
         * 
         * 该函数仅解析path、search、query
         *
         * @param {string} url 完整的URL
         * @param {Object=} options 控制解析行为的相关参数
         * @param {string} options.querySeparator 用于分隔path和search的字符
         * @return {Object} 一个URL对象
         */
        URL.parse = function(url, options) {
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
         * 根据path和给定的query对象生成URL对象
         *
         * @param {string} path URL的path部分
         * @param {Object} query URL的参数对象
         * @param {Object=} options 控制解析行为的相关参数
         * @param {string} options.querySeparator 用于分隔path和search的字符
         * @return {Object} 一个URL对象
         */
        URL.withQuery = function(path, query, options) {
            var defaults = { querySeparator: '~' };
            options = util.mix(defaults, options);

            var separator = path.indexOf(options.querySeparator) < 0 
                ? options.querySeparator 
                : '&';
            var search = URL.serialize(query);
            var url = path + separator + search;

            return URL.parse(url, options);

            // TODO: 这个方法在实际业务中可能经常使用，考虑提高效率
            // TODO: `path`中原有的参数，`query`中也定义的，是否需要覆盖
        };

        /**
         * 根据query规则解析字符串并返回参数对象
         *
         * @param {string} str query字符串，不能有起始的**?**或**#**字符
         * @return {Object} 从`str`解析得到的参数对象
         */
        URL.parseQuery = function(str) {
            var pairs = str.split('&');
            var query = {};
            for (var i = 0; i < pairs.length; i++) {
                // 考虑到有可能因为未处理转义问题，
                // 导致value中存在**=**字符，因此不使用`split`函数
                var pair = pairs[i];
                var index = pair.indexOf('=');
                // 没有**=**字符则认为值是**true**
                if (index < 0) {
                    query[decodeURIComponent(pair)] = true;
                }
                else {
                    var key = decodeURIComponent(pair.slice(0, index));
                    var value = decodeURIComponent(pair.slice(index + 1));
                    query[key] = value;
                }
            }
            return query;

            // TODO: 是否需要处理一个key多次出现在字符串中的情况
            // TODO: 是否需要将逗号分隔的value处理为字符串
        };

        /**
         * 将参数对象转换为URL字符串
         *
         * @param {Object} query 参数对象
         * @return {string} 转换后的URL字符串，相当于search部分
         */
        URL.serialize = function(query) {
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

        return URL;
    }
);