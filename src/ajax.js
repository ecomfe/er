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
         * 生成XMLHttpRequest请求的最终URL
         *
         * @param {string} url 请求的目标URL
         * @param {Object=} data 需要添加的参数
         */
        function resolveURL(url, data) {
            var URL = require('./URL');
            var query = URL.serialize(data);
            var delimiter = (url.indexOf('?') >= 0 ? '&' : '?');
            return url + delimiter + query;
        }

        /**
         * ajax模块
         */
        var ajax = {};
        require('./Observable').enable(ajax);

        /**
         * 发起XMLHttpRequest请求
         *
         * @param {Object} options 相关配置
         * @param {string} options.url 请求的地址
         * @param {string=} options.method 请求的类型
         * @param {Object=} options.data 请求的数据
         * @param {string=} options.dataType 返回数据的类型，
         * 可以为**json**或**text**，默认为**json**
         * @param {function=} options.done 请求成功后的回调函数
         * @param {function=} options.fail 请求失败后的回调函数
         * @param {function=} options.complete 请求完成时的回调函数，
         * 无论成功与否均会触发，且在`done`和`fail`之后
         * @param {number=} options.timeout 超时时间
         * @param {boolean=} options.cache 决定是否允许缓存
         * @return {FakeXHR} 一个`FakeXHR`对象，
         * 该对象有Promise的所有方法，以及`XMLHTTPRequest`对象的相应方法
         */
        ajax.request = function (options) {
            var assert = require('./assert');
            assert.hasProperty(options, url, 'url property is required');

            var defaults = {
                method: 'POST',
                data: {},
                cache: true
            };
            var util = require('./util');
            options = util.mix(defaults, options);

            var Deferred = require('./Deferred');
            var requesting = new Deferred();

            var xhr = window.XMLHttpRequest
                ? new XMLHttpRequest()
                : new ActiveXObject('Microsoft.XMLHTTP');

            var fakeXHR = requesting.promise;
            var xhrWrapper = {
                abort: function () {
                    xhr.abort();
                    fakeXHR.status = 408; // HTTP 408: Request Timeout
                    fakeXHR.readyState = xhr.readyState;
                    fakeXHR.responseText = '';
                    fakeXHR.responseXML = '';
                    requesting.reject(fakeXHR);
                    /**
                     * 任意一个XMLHttpRequest请求失败时触发
                     *
                     * @event fail
                     * @param {Object} e 事件对象
                     * @param {FakeXHR} e.xhr 请求使用的`FakeXHR`对象
                     */
                    ajax.on('fail', { xhr: fakeXHR });
                },
                setRequestHeader: function (name, value) {
                    xhr.setRequestHeader(name, value);
                }
            };
            util.mix(fakeXHR, xhrWrapper);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    var status = xhr.status;
                    // `file://`协议下状态码始终为0
                    if (status === 0) {
                        status = 200;
                    }
                    // IE9会把204状态码变成1223
                    else if (status === 1223) {
                        status = 204;
                    }

                    fakeXHR.status = xhr.status;
                    fakeXHR.readyState = xhr.readyState;
                    fakeXHR.responseText = xhr.responseText;
                    fakeXHR.responseXML = xhr.responseXML;

                    var data = xhr.responseText;
                    if (options.dataType === 'json') {
                        try {
                            data = util.parseJSON(data);
                        }
                        catch (ex) {
                            // 服务器返回的数据不符合JSON格式，认为请求失败
                            fakeXHR.error = ex;
                            requesting.reject(fakeXHR);
                            ajax.on('fail', { xhr: fakeXHR });
                            return;
                        }
                    }

                    if (status >= 200 && status < 300 || status === 304) {
                        requesting.resolve(data);
                        /**
                         * 任意一个XMLHttpRequest请求失败时触发
                         *
                         * @event fail
                         * @param {Object} e 事件对象
                         * @param {FakeXHR} e.xhr 请求使用的`FakeXHR`对象
                         */
                        ajax.on('done', { xhr: fakeXHR });
                    }
                    else {
                        requesting.reject(fakeXHR);
                        ajax.on('fail', { xhr: fakeXHR });
                    }
                }
            };

            if (typeof options.done === 'function') {
                fakeXHR.done(options.done);
            }
            if (typeof options.fail === 'function') {
                fakeXHR.fail(options.fail);
            }
            if (typeof options.complete === 'function') {
                fakeXHR.ensure(options.complete);   
            }

            var method = options.method.toUpperCase();
            var data = {};
            if (method === 'GET') {
                util.mix(data, options.data);
            }
            if (options.cache === false) {
                data['_'] = +new Date();
            }
            var url = resolveURL(options.url, data);

            xhr.open(method, url, true);
            if (method === 'GET') {
                xhr.send();
            }
            else {
                xhr.setRequestHeader(
                    'Content-type', 'application/x-www-form-urlencoded');
                var query = require('./URL').serialize(options.data);
                xhr.send(query);
            }

            if (options.timeout > 0) {
                setTimeout(util.bind(fakeXHR.abort, fakeXHR), options.timeout);
            }

            return fakeXHR;
        };

        /**
         * 发起一个GET请求
         *
         * @param {string} url 请求的地址
         * @param {Object=} data 请求的数据
         * @param {function=} done 请求成功后的回调函数
         * @param {boolean=} cache 决定是否允许缓存
         * @return {Object} 一个`FakeXHR`对象，
         * 该对象有Promise的所有方法，以及一个`abort`方法
         */
        ajax.get = function (url, data, done, cache) {
            var options = {
                method: 'GET',
                url: url,
                data: data,
                done: done,
                cache: cache || false
            };
            return ajax.request(options);
        };

        /**
         * 发起一个GET请求并获取JSON数据
         *
         * @param {string} url 请求的地址
         * @param {Object=} data 请求的数据
         * @param {function=} done 请求成功后的回调函数
         * @param {boolean=} cache 决定是否允许缓存
         * @return {Object} 一个`FakeXHR`对象，
         * 该对象有Promise的所有方法，以及一个`abort`方法
         */
        ajax.getJSON = function (url, data, done, cache) {
            var options = {
                method: 'GET',
                url: url,
                data: data,
                done: done,
                dataType: 'json',
                cache: cache || false
            };
            return ajax.request(options);
        };


        /**
         * 发起一个POST请求
         *
         * @param {string} url 请求的地址
         * @param {Object=} data 请求的数据
         * @param {function=} done 请求成功后的回调函数
         * @param {string=} dataType 指定w响应的数据格式，可为**text**或**json**
         * @return {Object} 一个`FakeXHR`对象，
         * 该对象有Promise的所有方法，以及一个`abort`方法
         */
        ajax.post = function (url, data, done, dataType) {
            var options = {
                method: 'POST',
                url: url, 
                data: data,
                dataType: dataType || 'json',
                done: done
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

            // 一定要在注册了事件之后再设置src，
            // 不然如果图片是读缓存的话，会错过事件处理，
            // 最后，对于url最好是添加客户端时间来防止缓存，
            // 同时服务器也配合一下传递`Cache-Control: no-cache;`
            img.src = resolveURL(url, data);
        };

        return ajax;
    }
);