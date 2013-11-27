/**
 * @class meta.AjaxHook
 *
 * AJAX钩子配置，通过{@link ajax#hooks}提供，
 * 通过重写方法来改变AJAX的执行行为
 */
function AjaxHook() {
    /**
     * @method beforeExecute
     *
     * 在执行逻辑以前被调用
     *
     * @param {meta.AjaxOption} options 请求时的参数
     */
    this.beforeExecute;

    /**
     * @method beforeCreate
     *
     * 在创建`XMLHttpRequest`前被调用
     *
     * 可在这个阶段查询前端的缓存，如果存在有效的缓存数据，则：
     *
     * 1. 调用`deferred.resolve`给出缓存的数据，使此请求完成
     * 2. 返回`true`
     *
     * 此后系统不会再发起请求，而直接使用缓存数据
     *
     * @param {meta.AjaxOption} options 请求时的参数
     * @param {Deferred} deferred 控制请求的`Deferred`对象
     * @return {boolean} 返回`true`表示请求已被勾子处理，系统将不再执行之后的任何逻辑
     */
    this.beforeExecute;

    /**
     * @method beforeSend
     *
     * 链接已打开但还未发送数据时调用
     *
     * 通常在这个阶段可以对HTTP头进行设置，如添加`Content-Type`或`Cache-Control`等
     *
     * @param {meta.FakeXHR} xhr 处理此次请求的对象
     * @param {meta.AjaxOption} options 请求时的参数外加默认参数融合后的配置对象
     */
    this.beforeSend;

    /**
     * @method afterReceive
     *
     * @param {meta.FakeXHR} xhr 处理此次请求的对象
     * @param {meta.AjaxOption} options 请求时的参数外加默认参数融合后的配置对象
     */
     this.afterReceive;

    /**
     * @method afterParse
     *
     * 在系统按数据类型处理完响应的`responseText`等后调用
     *
     * @param {Mixed} data 经处理后的数据，
     * 根据{@link meta.AjaxOption#dataType}的配置来决定类型
     * @param {meta.FakeXHR} xhr 处理此次请求的对象
     * @param {meta.AjaxOption} options 请求时的参数外加默认参数融合后的配置对象
     * @return {Mixed} 函数的返回值将被作为此次请求最终的返回数据使用
     */
    this.afterParse;

    /**
     * @method serializeArray
     *
     * 将数组数据序列化为请求可识别的格式，默认生成使用逗号分隔的字符串
     *
     * @param {string} prefix 键名的前缀
     * @param {Array} array 需要序列化的数组
     * @return {string}
     */
    this.serializeArray;

    /**
     * @method serializeData
     *
     * 将数据序列化为请求识别的格式，默认使用`application/x-www-form-urlencoded`格式
     *
     * @param {string} prefix 键名前缀，如果当前序列化的对象本身是主对象的一个属性，
     * 会有此参数值，其它情况下此参数为空字符串`""`
     * @param {Mixed} data 需要序列化的值，可能为任何类型
     * @param {string} contentType 请求的数据格式
     * @param {meta.FakeXHR} xhr 当前请求对象
     * @return {string}
     */
    this.serializeData;
}
