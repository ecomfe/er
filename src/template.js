/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 简易的、基于html注释的模板支持
 * @author erik, mytharcher, otakustay
 */
define(
    function (require) {
        var template = require('etpl/main');

        /**
         * 合并模板与数据
         * 
         * @param {HTMLElement} output 要输出到的容器元素
         * @param {string} tplName 模板名
         * @param {Model} [model] 获取数据的对象
         * @return {string}
         */
        template.merge = function (output, tplName, model) {
            var html = '';

            try {
                var html = template.render(tplName, model);
            }
            catch (ex) {
            }

            // 像IE中`<p>`里面不能放`<div>`这种情况是会有异常的，
            // 但是决定把这个异常抛出去，不静默处理了
            if (output) {
                output.innerHTML = html;
            }

            return html;
        };

        return template;
    }
);
