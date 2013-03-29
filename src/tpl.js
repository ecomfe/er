/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 加载template的AMD插件
 * @author otakustay
 */
define(
    function (require) {
        var plugin = {
            load: function (resourceId, parentRequire, load) {
                function addTemplate(text) {
                    var template = require('./template');
                    template.parse(text);
                    load(text);
                }

                var url = parentRequire.toUrl(resourceId);
                require('./ajax').get(url, null, true).then(addTemplate);
            }
        };

        return plugin;
    }
);