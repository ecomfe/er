/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 系统相关配置
 * @author otakustay
 */
define(
    /**
     * @class config
     *
     * 系统相关配置
     *
     * @singleton
     */
    {
        /**
         * 应用主DOM容器或其id，所有的主Action会渲染在此容器内
         *
         * @type {string | HTMLElement}
         */
        mainElement: 'main',

        /**
         * 起始路径
         *
         * @type {string}
         */
        indexURL: '/',

        /**
         * 系统名称，当访问一个没有配置{@link meta.ActionContext#title}的Action时，
         * 会默认使用此配置的值作为`document.title`显示
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
