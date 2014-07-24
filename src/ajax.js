/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file AJAX相关方法
 * @author otakustay
 */
define(
    function (require) {
        var TIMESTAMP_PARAM_KEY = '_';

        function serializeArray(prefix, array) {
            var encodedKey = prefix ? encodeURIComponent(prefix) : '';
            var encoded = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                encoded[i] = this.serializeData('', item);
            }
            return encodedKey
                ? encodedKey + '=' + encoded.join(',')
                : encoded.join(',');
        }

        function serializeData(prefix, data) {
            if (arguments.length === 1) {
                data = prefix;
                prefix = '';
            }

            if (data == null) {
                data = '';
            }
            var getKey = this.serializeData.getKey;
            var encodedKey = prefix ? encodeURIComponent(prefix) : '';

            var type = Object.prototype.toString.call(data);
            switch (type) {
                case '[object Array]':
                    return this.serializeArray(prefix, data);
                case '[object Object]':
                    var result = [];
                    for (var name in data) {
                        var propertyKey = getKey(name, prefix);
                        var propertyValue = this.serializeData(propertyKey, data[name]);
                        result.push(propertyValue);
                    }
                    return result.join('&');
                default:
                    return encodedKey
                        ? encodedKey + '=' + encodeURIComponent(data)
                        : encodeURIComponent(data);
            }
        }

        serializeData.getKey = function (propertyName, parentKey) {
            return parentKey ? parentKey + '.' + propertyName : propertyName;
        };

        /**
         * @class Ajax
         *
         * Ajax类
         *
         * 通过`require('er/ajax').Ajax`访问该类构造函数，其中`require('er/ajax')`是该类的全局实例
         *
         * @extends mini-event.EventTarget
         * @constructor
         */
        var exports = {};
        exports.constructor = function () {
            /**
             * AJAX钩子
             *
             * @type {meta.AjaxHook}
             */
            this.hooks = {
                serializeData: serializeData,
                serializeArray: serializeArray
            };

            /**
             * AJAX配置
             *
             * @type {meta.AjaxOption}
             */
            this.config = {
                cache: false,
                timeout: 0,
                charset: ''
            };
        };

        /**
         * 发起`XMLHttpRequest`请求
         *
         * @param {meta.AjaxOption} options 相关配置
         * @return {meta.FakeXHR}
         */
        exports.request = function (options) {
            if (typeof this.hooks.beforeExecute === 'function') {
                this.hooks.beforeExecute(options);
            }

            var assert = require('./assert');
            assert.hasProperty(options, 'url', 'url property is required');

            var defaults = {
                method: 'POST',
                data: {},
                cache: this.config.cache,
                timeout: this.config.timeout,
                charset: this.config.charset
            };
            var util = require('./util');
            options = util.mix(defaults, options);

            var Deferred = require('./Deferred');
            var requesting = new Deferred();

            if (typeof this.hooks.beforeCreate === 'function') {
                var canceled = this.hooks.beforeCreate(options, requesting);
                if (canceled === true) {
                    var fakeXHR = requesting.promise;
                    fakeXHR.abort = function () {};
                    fakeXHR.setRequestHeader = function () {};
                    return fakeXHR;
                }
            }

            var xhr = window.XMLHttpRequest
                ? new XMLHttpRequest()
                : new window.ActiveXObject('Microsoft.XMLHTTP');

            util.mix(xhr, options.xhrFields);

            var fakeXHR = requesting.promise;
            var xhrWrapper = {
                abort: function () {
                    // 有些浏览器`abort()`就会把`readyState`变成4，
                    // 这就会导致进入处理函数变成**resolved**状态，
                    // 因此事先去掉处理函数，然后直接进入**rejected**状态
                    xhr.onreadystatechange = null;
                    try {
                        xhr.abort();
                    }
                    catch (ex) {
                    }
                    if (!fakeXHR.status) {
                        fakeXHR.status = 0;
                    }
                    fakeXHR.readyState = xhr.readyState;
                    fakeXHR.responseText = '';
                    fakeXHR.responseXML = '';
                    requesting.reject(fakeXHR);
                },
                setRequestHeader: function (name, value) {
                    xhr.setRequestHeader(name, value);
                },
                getAllResponseHeaders: function () {
                    return xhr.getAllResponseHeaders();
                },
                getResponseHeader: function (name) {
                    return xhr.getResponseHeader(name);
                },
                getRequestOption: function (name) {
                    return options[name];
                }
            };
            util.mix(fakeXHR, xhrWrapper);

            var eventObject = { xhr: fakeXHR, options: options };
            fakeXHR.then(
                /**
                 * @event done
                 *
                 * 任意一个请求成功时触发
                 *
                 * @param {meta.AjaxOption} options 请求的配置信息
                 * @param {meta.FakeXHR} xhr 请求对象
                 */
                util.bind(this.fire, this, 'done', eventObject),
                /**
                 * @event fail
                 *
                 * 任意一个请求失败时触发
                 *
                 * @param {meta.FakeXHR} xhr 请求对象
                 * @param {meta.AjaxOption} options 请求的配置信息
                 */
                util.bind(this.fire, this, 'fail', eventObject)
            );

            var processRequestStatus = function () {
                if (xhr.readyState === 4) {
                    var status = fakeXHR.status || xhr.status;
                    // IE9会把204状态码变成1223
                    if (status === 1223) {
                        status = 204;
                    }

                    fakeXHR.status = fakeXHR.status || status;
                    fakeXHR.readyState = xhr.readyState;
                    fakeXHR.responseText = xhr.responseText;
                    fakeXHR.responseXML = xhr.responseXML;

                    if (typeof this.hooks.afterReceive === 'function') {
                        this.hooks.afterReceive(fakeXHR, options);
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

                    if (typeof this.hooks.afterParse === 'function') {
                        try {
                            data = this.hooks.afterParse(data, fakeXHR, options);
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

            xhr.onreadystatechange = util.bind(processRequestStatus, this);

            var method = options.method.toUpperCase();
            var data = {};
            if (method === 'GET') {
                util.mix(data, options.data);
            }
            if (options.cache === false) {
                data[TIMESTAMP_PARAM_KEY] = +new Date();
            }
            var query = this.hooks.serializeData('', data, 'application/x-www-form-urlencoded');
            var url = options.url;
            if (query) {
                var delimiter = url.indexOf('?') >= 0 ? '&' : '?';
                url += delimiter + query;
            }

            xhr.open(method, url, true);

            if (typeof this.hooks.beforeSend === 'function') {
                this.hooks.beforeSend(fakeXHR, options);
            }

            if (method === 'GET') {
                xhr.send();
            }
            else {
                var contentType = options.contentType || 'application/x-www-form-urlencoded';
                var query = this.hooks.serializeData('', options.data, contentType, fakeXHR);
                if (options.charset) {
                    contentType += ';charset=' + options.charset;
                }
                xhr.setRequestHeader('Content-Type', contentType);
                xhr.send(query);
            }

            if (options.timeout > 0) {
                var notifyTimeout = function () {
                    /**
                     * @event timeout
                     *
                     * 任意一个请求成功时触发，
                     * 在此事件后会再触发一次{@link Ajax#fail}事件
                     *
                     * @param {meta.FakeXHR} xhr 请求对象
                     * @param {meta.AjaxOption} options 请求的配置信息
                     */
                    this.fire(
                        'timeout',
                        { xhr: fakeXHR, options: options }
                    );
                    fakeXHR.status = 408; // HTTP 408: Request Timeout
                    fakeXHR.abort();
                };
                var tick = setTimeout(util.bind(notifyTimeout, this), options.timeout);
                fakeXHR.ensure(function () { clearTimeout(tick); });
            }

            return fakeXHR;
        };

        /**
         * 发起一个`GET`请求
         *
         * @param {string} url 请求的地址
         * @param {Object} [data] 请求的数据
         * @param {boolean} [cache] 决定是否允许缓存
         * @return {meta.FakeXHR}
         */
        exports.get = function (url, data, cache) {
            var options = {
                method: 'GET',
                url: url,
                data: data,
                cache: cache || this.config.cache
            };
            return this.request(options);
        };

        /**
         * 发起一个`GET`请求并获取JSON数据
         *
         * @param {string} url 请求的地址
         * @param {Object} [data] 请求的数据
         * @param {boolean} [cache] 决定是否允许缓存
         * @return {meta.FakeXHR}
         */
        exports.getJSON = function (url, data, cache) {
            var options = {
                method: 'GET',
                url: url,
                data: data,
                dataType: 'json',
                cache: cache || this.config.cache
            };
            return this.request(options);
        };


        /**
         * 发起一个`POST`请求
         *
         * @param {string} url 请求的地址
         * @param {Object} [data] 请求的数据
         * @param {string} [dataType="json"] 指定响应的数据格式
         * @return {meta.FakeXHR}
         */
        exports.post = function (url, data, dataType) {
            var options = {
                method: 'POST',
                url: url,
                data: data,
                dataType: dataType || 'json'
            };
            return this.request(options);
        };

        /**
         * 发送一个日志请求，该请求只负责发出，不负责保证送达，且不支持回调函数
         *
         * @param {string} url 发送的目标URL
         * @param {Object} [data] 额外添加的参数
         */
        exports.log = function (url, data) {
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

            var query = this.hooks.serializeData('', data, 'application/x-www-form-urlencoded');
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

        var Ajax = require('eoo').create(require('mini-event/EventTarget'), exports);
        var instance = new Ajax();
        instance.Ajax = Ajax;
        return instance;
    }
);
