/**
 * @class meta.ActionContext
 *
 * Action执行上下文类
 */
function ActionContext () {
    /**
     * @property {URL} url
     *
     * 当前的URL
     */
    this.url;

    /**
     * @property {URL} referrer
     *
     * 来源URL
     */
    this.referrer;

    /**
     * @property {boolean} isChildAction
     *
     * 是否作为子Action加载
     */
    this.isChildAction;

    /**
     * @property {string} title
     *
     * 当前Action代表页面的标题
     */
    this.title;

    /**
     * @property {string | HTMLElement} container
     *
     * 使用的容器元素的id
     */
    this.container;

    /**
     * @property {Object} args
     *
     * 相关参数，包含了：
     *
     * - 从URL中获取的参数
     * - 在{@link meta.ActionConfig#args}中配置的参数
     * - 通过{@link Controller#renderChildAction}加载时传递的`options`参数
     */
    this.args;
}
