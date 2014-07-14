/**
 * @class meta.AjaxOption
 *
 * AJAX请求参数
 */
function AjaxOption() {

    /**
     * @property {string} url
     *
     * 请求的地址
     */
    this.url;

    /**
     * @property {string} [method="POST"]
     *
     * 请求使用的动作， **大小写不敏感** ，可以为`GET`、`POST`等所有AJAX支持的值
     */
    this.method;

    /**
     * @property {Object} [data]
     *
     * 需要发送的数据
     */
    this.data;

    /**
     * @property {string} [dataType="text"]
     *
     * 处理响应的数据的类型， **大小写敏感** ，可以为：
     *
     * - `"text"`：表示响应为纯文本，此时直接返回`responseText`
     * - `"json"`：表示响应为JSON格式，此时将`responseText`解析为对象
     */
    this.dataType;

    /**
     * @property {number} [timeout]
     *
     * 请求超时时间，以毫秒为单位。超过此属性设置的时间将自动中断请求
     *
     * 默认会使用{@link Ajax#config}下的配置
     *
     * 如果不存在此属性或值小于等于0，则认为永不超时
     */
    this.timeout;

    /**
     * @property {boolean} [cache]
     *
     * 是否使用缓存。不使用缓存时，`GET`请求会加上时间戳
     *
     * 默认会使用{@link Ajax#config}下的配置
     */
    this.cache;

    /**
     * @property {string} [charset]
     *
     * 指定请求的编码，会添加到请求的`Content-Type`头后面
     *
     * 默认会使用{@link Ajax#config}下的配置
     */
    this.charset;

    /**
     * @property {string} [contentType="application/x-www-form-urlencoded"]
     *
     * 请求的数据格式，作为`Content-Type`头发送，同时可能影响到数据序列化的算法
     */
    this.contentType;

    /**
     * @property {Object} [xhrFields]
     *
     * 额外赋值到原生的`XMLHttpRequest`实例上的属性，该对象将被混合当本次请求创建的`XMLHttpRequest`实例上
     *
     * 根据现有标准，唯一有用的属性是`withCrentials`
     */
    this.xhrFields;
}
