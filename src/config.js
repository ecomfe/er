/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 系统相关配置
 * @author otakustay
 */
define(
    {
        /**
         * 应用主DOM容器的id
         *
         * @type {string}
         */
        mainElement: 'main',

        /**
         * 起始路径
         *
         * @type {string}
         */
        indexURL: '/',

        /**
         * 系统名称
         *
         * @type {string}
         */
        systemName: '',

        /**
         * 无权限访问某个Action时的跳转路径
         *
         * @type {string}
         */
        noAuthorityLocation: '/401',

        /**
         * 找不到Action时的跳转路径
         *
         * @type {string}
         */
        notFoundLocation: '/404'
    }
);