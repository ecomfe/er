/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 权限管理对象
 * @author otakustay
 */
define(
    function () {
        var authorities = {};

        /**
         * @class permission
         *
         * 权限管理器，提供权限的注册和判断功能
         *
         * @singleton
         */
        var permssion = {
            /**
             * 添加权限
             * 
             * 权限以字符串作为名称，添加权限说明时，传递一个对象，
             * 其中的健为权限名称，值为是否拥有该权限
             * 
             * 权限说明可以嵌套，如：
             * 
             *     {
             *         books: { VIEW_BOOK: true, EDIT_BOOK: false },
             *         authors: { VIEW_AUTHOR: true, EDIT_AUTHOR: true }
             *     }
             *
             * @param {Object} data 权限说明
             */
            add: function (data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        var value = data[key];
                        if (typeof value === 'object') {
                            this.add(value);
                        }
                        else {
                            authorities[key] = value;
                        }
                    }
                }
            },

            /**
             * 判断是否拥有指定权限
             *
             * @param {string} name 权限名称
             * @return {boolean} 是否拥有`name`表示的权限
             */
            isAllow: function (name) {
                return !!authorities[name];
            }
        };

        return permssion;
    }
);
