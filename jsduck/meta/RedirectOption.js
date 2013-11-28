/**
 * @class meta.RedirectOption
 *
 * 重定向选项
 */
function RedirectOption() {
    /**
     * @property {boolean} [silent=false]
     *
     * 静默跳转，即改变URL但不触发
     * {@link locator#event-redirect}事件或进行Action加载等工作
     */
    this.silent;

    /**
     * @property {boolean} [force=flase]
     *
     * 强制跳转，即URL无变化时也重新加载
     */
    this.force;
}
