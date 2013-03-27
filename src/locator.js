/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 地址监听器对象
 * @author otakustay, erik
 */
define(
    function (require) {
        /**
         * 地址监听对象
         * 
         * 该对象用于监听地址中的hash部分的变化，以及根据要求更新hash值
         * 
         * locator的基本工作流程：
         * 
         * 1. 监听hash的变化
         * 2. 当hash变化时，如果确实发生变化（与上一次的值不同），则执行逻辑
         * 3. 保存当前的地址信息（高版本浏览器此时自动记录历史项）
         * 4. 触发`redirect`事件
         */
        var locator = {};
        var currentLocation = '';

        /**
         * 获取URL中的hash值
         *
         * @return {string} 当前URL中的hash值
         */
        function getLocation() {
            // Firefox下`location.hash`存在自动解码的情况，
            // 比如hash的值是**abc%3def**，
            // 在Firefox下获取会成为**abc=def**
            // 为了避免这一情况，需要从`location.href`中分解
            var index = location.href.indexOf('#');
            var url = index === -1 
                ? ''
                : location.href.slice(index);

            return url;
        }

        /**
         * 执行hash变更的相关逻辑
         */
        function forwardHash() {
            var url = getLocation();
            locator.redirect(url);
        }

        /**
         * 更新当前的hash值，同时在历史记录中添加该项
         * 
         * 如果hash值与当前的地址相同则不会进行更新
         * 
         * 注意该函数不会触发`redirect`事件，需要跳转请使用`forward`方法，
         * 直接使用`updateURL`修改地址**后果自负**
         *
         * @param {string} url 需要进行更新的hash值
         * @return {boolean} 如果地址有过变更则返回true
         */
        function updateURL(url) {
            var changed = currentLocation !== url;

            // 存储当前信息
            // 
            // Opera下，相同的hash重复写入会在历史堆栈中重复记录，
            // 需要再行与当前的hash比较
            if (changed && getLocation() !== url) {
                location.hash = url;
            }

            currentLocation = url;
            return changed;
        }

        /**
         * 根据输入的URL，进行处理后获取真实应该跳转的URL地址
         *
         * @param {string | URL} url 重定向的地址
         */
        locator.resolveURL = function (url) {
            // 当类型为URL时，使用`toString`可转为正常的url字符串
            url = url + '';
            // 如果直接获取`location.hash`，则会有开始处的**#**符号需要去除
            if (url.indexOf('#') === 0) {
                url = url.slice(1);
            }

            // 未给定url时，指向起始页
            if (!url) {
                url = require('./config').indexURL;
            }

            return url;
        };

        /**
         * 执行重定向逻辑
         *
         * @param {string | URL} url 重定向的地址
         * @param {Object=} options 额外附加的参数对象
         * @param {boolean=} options.force 确定当跳转地址不变时是否强制刷新
         */
        locator.redirect = function (url, options) {
            options = options || {};
            url = locator.resolveURL(url);

            var isLocationChanged = updateURL(url);
            if (isLocationChanged || options.force) {
                /**
                 * URL跳转时触发
                 *
                 * @event redirect
                 * @param {Object} e 事件对象
                 * @param {string} e.url 当前的URL
                 */
                locator.fire('redirect', { url: url });

                require('./events').fire('redirect', { url: url });
            }
        };

        /**
         * 刷新当前地址
         */
        locator.reload = function () {
            if (currentLocation) {
                locator.redirect(currentLocation, { force: true });
            }
        };

        /**
         * 开始`locator`对象的工作
         */
        locator.start = function () {
            // 如果有hashchange事件则使用事件，否则定时监听
            if (window.addEventListener) {
                window.addEventListener('hashchange', forwardHash);
            }
            else if ('onhashchange' in window) {
                window.attachEvent('onhashchange', forwardHash);
            }
            else {
                setInterval(forwardHash, 100);
            }

            // 处理初次进入的hash
            setTimeout(forwardHash, 0);
        };

        require('./Observable').enable(locator);
        return locator;
    }
);