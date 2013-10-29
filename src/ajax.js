/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file ajax相关方法
 * @author otakustay
 */
define(
    function (require) {

        /**
         * ajax模块
         */
        var ajax = {};
        require('./Observable').enable(ajax);

        /**
         * 每次请求流程的勾子，包含以下属性：
         * 
         * - `beforeExecute`：在执行逻辑以前
         *     - `{Object} options`：请求时的参数
         * - `beforeCreate`：在创建`XMLHttpRequest`前
         *     - `{Object} options`：请求时的参数外加默认参数融合后的对象
         *     - `{Deferred} request`：控制请求的`Deferred`对象
         *     - 返回**true**表示请求已经处理，ajax模块将不再进行后续的逻辑
         * - `beforeSend`：链接打开但没发送数据
         *     - `{FakeXHR} xhr`：伪造的`XMLHttpRequest`对象
         *     - `{Object} options`：请求时的参数外加默认参数融合后的对象
         * - `afterReceive`：在收到返回后
         *     - `{FakeXHR} xhr`：伪造的`XMLHttpRequest`对象
         *     - `{Object} options`：请求时的参数外加默认参数融合后的对象
         * - `afterParse`：在按数据类型处理完响应后
         *     - `{*} data`：返回的数据
         *     - `{FakeXHR} xhr`：伪造的`XMLHttpRequest`对象
         *     - `{Object} options`：请求时的参数外加默认参数融合后的对象
         *     - 返回值将被作为最终触发回调时的数据
         *
         * @type {Object}
         * @public
         */
        ajax.hooks = {};

        ajax.hooks.serializeArray = function (prefix, array) {
            var encodedKey = prefix ? encodeURIComponent(prefix) : '';
            var encoded = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                encoded[i] = ajax.hooks.serializeData('', item);
            }
            return encodedKey
                ? encodedKey + '=' + encoded.join(',')
                : encoded.join(',');
        };

        ajax.hooks.serializeData = function (prefix, data) {
            if (arguments.length === 1) {
                data = prefix;
                prefix = '';
            }

            if (data == null) {
                data = '';
            }
            var getKey = ajax.hooks.serializeData.getKey;
            var encodedKey = prefix ? encodeURIComponent(prefix) : '';

            var type = Object.prototype.toString.call(data);
            switch (type) {
                case '[object Array]':
                    return ajax.hooks.serializeArray(prefix, data);
                case '[object Object]':
                    var result = [];
                    for (var name in data) {
                        var propertyKey = getKey(name, prefix);
                        var propertyValue = 
                            ajax.hooks.serializeData(propertyKey, data[name]);
                        result.push(propertyValue);
                    }
                    return result.join('&');
                default:
                    return encodedKey 
                        ? encodedKey + '=' + encodeURIComponent(data)
                        : encodeURIComponent(data);
            }
        };

        ajax.hooks.serializeData.getKey = function (propertyName, parentKey) {
            return parentKey ? parentKey + '.' + propertyName : propertyName;
        };

        ajax.config = {
            cache: false,
            timeout: 0,
            charset: ''
        };

        /**
         * 发起XMLHttpRequest请求
         *
         * @param {Object} options 相关配置
         * @param {string} options.url 请求的地址
         * @param {string=} options.method 请求的类型
         * @param {Object=} options.data 请求的数据
         * @param {string=} options.dataType 返回数据的类型，
         * 可以为**json**或**text**，默认为**responseText**
         * @param {number=} options.timeout 超时时间
         * @param {boolean=} options.cache 决定是否允许缓存
         * @return {FakeXHR} 一个`FakeXHR`对象，
         * 该对象有Promise的所有方法，以及`XMLHTTPRequest`对象的相应方法
         */
        ajax.request = function (options) {
            if (typeof ajax.hooks.beforeExecute === 'function') {
                ajax.hooks.beforeExecute(options);
            }

            var assert = require('./assert');
            assert.hasProperty(options, 'url', 'url property is required');

            var defaults = {
                method: 'POST',
                data: {},
                cache: ajax.config.cache,
                timeout: ajax.config.timeout,
                charset: ajax.config.charset
            };
            var util = require('./util');
            options = util.mix(defaults, options);

            var Deferred = require('./Deferred');
            var requesting = new Deferred();

            if (typeof ajax.hooks.beforeCreate === 'function') {
                var canceled = ajax.hooks.beforeCreate(options, requesting);
                if (canceled === true) {
                    var fakeXHR = requesting.promise;
                    fakeXHR.abort = function () {};
                    fakeXHR.setRequestHeader = function () {};
                    return fakeXHR;
                }
            }

            var xhr = window.XMLHttpRequest
                ? new XMLHttpRequest()
                : new ActiveXObject('Microsoft.XMLHTTP');

            var fakeXHR = requesting.promise;
            var xhrWrapper = {
                abort: function () {
                    // 有些浏览器`abort()`就会把`readyState`变成4，
                    // 这就会导致进入处理函数变成**resolved**状态，
                    // 因此事先去掉处理函数，然后直接进入**rejected**状态
                    xhr.onreadystatechange = null;
                    xhr.abort();
                    fakeXHR.status = 0;
                    fakeXHR.readyState = xhr.readyState;
                    fakeXHR.responseText = '';
                    fakeXHR.responseXML = '';
                    requesting.reject(fakeXHR);
                },
                setRequestHeader: function (name, value) {
                    xhr.setRequestHeader(name, value);
                }
            };
            util.mix(fakeXHR, xhrWrapper);

            fakeXHR.then(
                function () {
                    /**
                     * 任意一个XMLHttpRequest请求失败时触发
                     *
                     * @event done
                     * @param {Object} e 事件对象
                     * @param {FakeXHR} e.xhr 请求使用的`FakeXHR`对象
                     */
                    ajax.fire('done', { xhr: fakeXHR });
                },
                function () {
                    /**
                     * 任意一个XMLHttpRequest请求失败时触发
                     *
                     * @event fail
                     * @param {Object} e 事件对象
                     * @param {FakeXHR} e.xhr 请求使用的`FakeXHR`对象
                     */
                    ajax.fire('fail', { xhr: fakeXHR });
                }
            );

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    var status = fakeXHR.status || xhr.status;
                    // `file://`协议下状态码始终为0
                    if (status === 0) {
                        status = 200;
                    }
                    // IE9会把204状态码变成1223
                    else if (status === 1223) {
                        status = 204;
                    }

                    fakeXHR.status = fakeXHR.status || status;
                    fakeXHR.readyState = xhr.readyState;
                    fakeXHR.responseText = xhr.responseText;
                    fakeXHR.responseXML = xhr.responseXML;

                    if (typeof ajax.hooks.afterReceive === 'function') {
                        ajax.hooks.afterReceive(fakeXHR, options);
                    }

                    // 如果请求不成功，也就不用再分解数据了，直接丢回去就好
                    if (status < 200 || (status >= 300 && status !== 304)) {
                        requesting.reject(fakeXHR);
                        return;
                    }

                    var data = xhr.responseText;
                    if (options.dataType === 'json') {
                        try {
                            data = util.parseJSON(data);
                        }
                        catch (ex) {
                            // 服务器返回的数据不符合JSON格式，认为请求失败
                            fakeXHR.error = ex;
                            requesting.reject(fakeXHR);
                            return;
                        }
                    }

                    if (typeof ajax.hooks.afterParse === 'function') {
                        try {
                            data = 
                                ajax.hooks.afterParse(data, fakeXHR, options);
                        }
                        catch (ex) {
                            fakeXHR.error = ex;
                            requesting.reject(fakeXHR);
                            return;
                        }
                    }

                    // 数据处理成功后，进行回调
                    requesting.resolve(data);
                }
            };

            var method = options.method.toUpperCase();
            var data = {};
            if (method === 'GET') {
                util.mix(data, options.data);
            }
            if (options.cache === false) {
                data['_'] = +new Date();
            }
            var query = ajax.hooks.serializeData(
                '', data, 'application/x-www-form-urlencoded');
            var url = options.url;
            if (query) {
                var delimiter = url.indexOf('?') >= 0 ? '&' : '?';
                url += delimiter + query;
            }

            xhr.open(method, url, true);

            if (typeof ajax.hooks.beforeSend === 'function') {
                ajax.hooks.beforeSend(fakeXHR, options);
            }

            if (method === 'GET') {
                xhr.send();
            }
            else {
                var contentType = 
                    options.contentType || 'application/x-www-form-urlencoded';
                if (options.charset) {
                    contentType += ';charset=' + options.charset;
                }
                xhr.setRequestHeader('Content-Type', contentType);
                var query = ajax.hooks.serializeData(
                    '', options.data, contentType, fakeXHR);
                xhr.send(query);
            }

            if (options.timeout > 0) {
                var tick = setTimeout(
                    function () {
                        fakeXHR.status = 408; // HTTP 408: Request Timeout
                        fakeXHR.abort();
                    },
                    options.timeout
                );
                fakeXHR.ensure(function () { clearTimeout(tick); });
            }

            return fakeXHR;
        };

        /**
         * 发起一个GET请求
         *
         * @param {string} url 请求的地址
         * @param {Object=} data 请求的数据
         * @param {boolean=} cache 决定是否允许缓存
         * @return {Object} 一个`FakeXHR`对象，
         * 该对象有Promise的所有方法，以及一个`abort`方法
         */
        ajax.get = function (url, data, cache) {
            var options = {
                method: 'GET',
                url: url,
                data: data,
                cache: cache || ajax.config.cache
            };
            return ajax.request(options);
        };

        /**
         * 发起一个GET请求并获取JSON数据
         *
         * @param {string} url 请求的地址
         * @param {Object=} data 请求的数据
         * @param {boolean=} cache 决定是否允许缓存
         * @return {Object} 一个`FakeXHR`对象，
         * 该对象有Promise的所有方法，以及一个`abort`方法
         */
        ajax.getJSON = function (url, data, cache) {
            var options = {
                method: 'GET',
                url: url,
                data: data,
                dataType: 'json',
                cache: cache || ajax.config.cache
            };
            return ajax.request(options);
        };


        /**
         * 发起一个POST请求
         *
         * @param {string} url 请求的地址
         * @param {Object=} data 请求的数据
         * @param {string=} dataType 指定w响应的数据格式，可为**text**或**json**
         * @return {Object} 一个`FakeXHR`对象，
         * 该对象有Promise的所有方法，以及一个`abort`方法
         */
        ajax.post = function (url, data, dataType) {
            var options = {
                method: 'POST',
                url: url, 
                data: data,
                dataType: dataType || 'json'
            };
            return ajax.request(options);
        };

        /**
         * 发送一个日志请求，该请求只负责发出，不负责保证送达，且不支持回调函数
         *
         * @param {string} url 发送的目标URL
         * @param {Object=} data 额外添加的参数
         */
        ajax.log = function (url, data) {
            var img = new Image();
            var pool = window.ER_LOG_POOL || (window.ER_LOG_POOL = {});
            var id = +new Date();
            pool[id] = img;

            img.onload = img.onerror = img.onabort = function () {
                // 如果这个img很不幸正好加载了一个存在的资源，又是个gif动画，
                // 则在gif动画播放过程中，img会多次触发onload，因此一定要清空
                img.onload = img.onerror = img.onabort = null;

                pool[id] = null;

                // 下面这句非常重要，
                // new Image创建的是DOM，
                // DOM的事件中形成闭包环引用DOM是典型的内存泄露，
                // 因此这里一定要置为null
                img = null;
            };

            var query = ajax.hooks.serializeData(
                '', data, 'application/x-www-form-urlencoded');
            if (query) {
                var delimiter = url.indexOf('?') >= 0 ? ':' : '?';
                url += delimiter + query;
            }
            // 一定要在注册了事件之后再设置src，
            // 不然如果图片是读缓存的话，会错过事件处理，
            // 最后，对于url最好是添加客户端时间来防止缓存，
            // 同时服务器也配合一下传递`Cache-Control: no-cache;`
            img.src = url;
        };

        return ajax;
    }
);
