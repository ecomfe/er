/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 通用枚举类
 * @author otakustay, wangyaqiong(catkin2009@gmail.com)
 * @date $DATE$
 */
define(
    function () {
        /**
         * 通用枚举类，用于生成一个枚举对象
         *
         * 枚举对象是业务系统中非常普遍使用的一个类型，
         * 其基本功能是将一个数字和具体的含义对应起来
         *
         * 枚举是一类数值的集合，枚举中的每一项包括3个属性：
         *
         * - `value`：对应原始的数字值
         * - `alias`：枚举项在业务中的别名，通常使用大写字母和下划线组成的常量表达方式
         * - `text`：该项显示时的文字
         *
         * 使用本类，可以简单地创建一个枚举对象，如：
         *
         *     var Status = new Enum(
         *         { alias: 'NORMAL', text: '正常' },
         *         { alias: 'DISABLED', text: '禁用' },
         *         { alias: 'DELETED', text: '已删除' }
         *     );
         *
         * 传入的参数的`value`由0开始今次递增。对于`value`非递增的枚举，
         * 在构造时对指定的项传入`value`属性即可，如：
         *
         *     var MouseButton = new Enum(
         *         { alias: 'LEFT', text: '正常', value: 1 },
         *         { alias: 'RIGHT', text: '禁用', value: 2 },
         *         { alias: 'MIDDLE', text: '已删除', value: 4 }
         *     );
         *
         * 枚举会维护2个映射，分别为`value`至`alias`及`alias`至`value`，
         * 因此可以简单地通过属性访问的方式获取`alias`或`value`：
         *
         *     if (user.status = Status.DELETED) {
         *         warn('该用户已经删除');
         *     }
         *
         * @param {meta.EnumItem...} 枚举项
         * @constructor
         */
        function Enum() {
            this.valueIndex = [];
            this.aliasIndex = {};
            this.textIndex = {};

            for (var i = 0; i < arguments.length; i++) {
                var element = arguments[i];
                if (element.value == null) {
                    element.value = i;
                }
                this.addElement(element);
            }
        }

        /**
         * 为当前枚举对象添加一个{@link meta.EnumItem 枚举项}
         *
         * @param {meta.EnumItem} element 待添加的枚举项
         * @throws {Error} 如果`value`或`alias`存在重复则抛出异常
         */
        Enum.prototype.addElement = function (element) {
            if (this.hasOwnProperty(element.value)) {
                throw new Error(
                    'Already defined an element with value'
                    + element.value + ' in this enum type'
                );
            }

            if (this.hasOwnProperty(element.alias)) {
                throw new Error(
                    'Already defined an element with alias'
                    + '"' + element.value + '" in this enum type'
                );
            }

            this[element.value] = element.alias;
            this[element.alias] = element.value;

            this.valueIndex[element.value] = element;
            this.aliasIndex[element.alias] = element;
            this.textIndex[element.text] = element;
        };

        /**
         * 根据数值获取枚举项
         *
         * @param {number} value 数值
         * @return {meta.EnumItem} 对应的枚举项
         */
        Enum.prototype.fromValue = function (value) {
            return this.valueIndex[value];
        };

        /**
         * 根据别名获取枚举项
         *
         * @param {string} alias 别名
         * @return {meta.EnumItem} 对应的枚举项
         */
        Enum.prototype.fromAlias = function (alias) {
            return this.aliasIndex[alias];
        };

        /**
         * 根据文字获取枚举项
         *
         * @param {string} text 文字
         * @return {meta.EnumItem} 对应的枚举项
         */
        Enum.prototype.fromText = function (text) {
            return this.textIndex[text];
        };

        /**
         * 根据数值获取对应枚举项的文字
         *
         * @param {number} value 数值
         * @return {string} 对应的文字
         */
        Enum.prototype.getTextFromValue = function (value) {
            return this.fromValue(value).text;
        };

        /**
         * 根据文字获取对应枚举项的文字
         *
         * @param {string} alias 文字
         * @return {string} 对应的文字
         */
        Enum.prototype.getTextFromAlias = function (alias) {
            return this.fromAlias(alias).text;
        };

        /**
         * 根据数值获取对应枚举项的数值
         *
         * @param {string} alias 数值
         * @return {number} 对应的数值
         */
        Enum.prototype.getValueFromAlias = function (alias) {
            return this.fromAlias(alias).value;
        };

        /**
         * 根据文字获取对应枚举项的数值
         *
         * @param {string} text 文字
         * @return {number} 对应的数值
         */
        Enum.prototype.getValueFromText = function (text) {
            return this.fromText(text).value;
        };

        /**
         * 根据数值获取对应枚举项的别名
         *
         * @param {number} value 数值
         * @return {string} 对应的别名
         */
        Enum.prototype.getAliasFromValue = function (value) {
            return this.fromValue(value).alias;
        };

        /**
         * 根据文字获取对应枚举项的别名
         *
         * @param {string} text 文字
         * @return {string} 对应的别名
         */
        Enum.prototype.getAliasFromText = function (text) {
            return this.fromText(text).alias;
        };

        /**
         * 将当前枚举转换为数组，常用于下拉选择控件之类的数据源
         *
         * @return {meta.EnumItem[]} 每次返回一个全新的数组副本
         */
        Enum.prototype.toArray = function () {
            // 必须做一次复制操作，不能让外部的修改影响枚举结构
            var array = [];
            for (var i = 0; i < this.valueIndex.length; i++) {
                // 由于`value`不一定是连续的，所以一定要去除空项
                if (this.valueIndex[i]) {
                    array.push(this.valueIndex[i]);
                }
            }
            return array;
        };

        return Enum;
    }
);
