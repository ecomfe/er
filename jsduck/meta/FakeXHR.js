/**
 * @class meta.FakeXHR
 *
 * 伪`XMLHttpRequest`对象
 *
 * 该对象是框架的{@link ajax}模块使用的请求对象，其在标准的`XMLHttpRequest`对象上封装，
 * 以使`XMLHttpRequest`可以与{@link meta.Promise}模型兼容
 *
 * 本对象提供{@link meta.Promise}对象的所有功能，
 * 除此之外还额外添加与`XMLHttpRequest`相关的方法
 *
 * @extends {meta.Promise}
 */
function FakeXHR() {
    /**
     * @method abort
     *
     * 中断当前请求
     *
     * 当请求中断后，当前的对象会进入`rejected`状态，相关回调会被触发
     *
     * 由于中断请求引起的{Deferred#reject}操作，其请求对象有以下特点：
     *
     * - {@link meta.FakeXHR#status}值为`0`
     * - {@link meta.FakeXHR#responseText}为空字符串`""`
     * - @{link meta.FakeXHR#responseXML}为空字符串`""`
     */
    this.abort;

    /**
     * @method setRequestHeader
     *
     * 设置请求的HTTP头
     *
     * @param {string} name 头名称
     * @param {string} value 头的值
     */
    this.setRequestHeader;

    /**
     * @method getAllResponseHeaders
     *
     * 获取所有响应头，如果请求未到响应阶段则返回`null`
     *
     * @return {Object} 事实上返回的是一个`DOMString`对象
     */
    this.getAllResponseHeaders;

    /**
     * @method getResponseHeader
     *
     * 获取指定名称的响应头
     *
     * @param {string} name 需要获取的头名称
     * @return {string | null} 对应响应头的值，如果不存在则返回`null`
     */
    this.getResponseHeader;

    /**
     * @property {number} status
     *
     * 服务器返回状态码
     */
    this.status;

    /**
     * @property {number} readyState
     *
     * 请求的阶段状态
     */
    this.readyState;

    /**
     * @property {string} responseText
     *
     * 服务器返回的字符串
     */
    this.responseText;

    /**
     * @property {string} responseXML
     *
     * 服务器返回的XML串
     */
    this.responseXML;
}
