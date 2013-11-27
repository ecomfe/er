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
}
