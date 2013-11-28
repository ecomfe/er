/**
 * @class meta.Resolver
 *
 * 处理{@link Deferred}对象状态的对象
 *
 * 此对象不能直接创建，须通过{@link Deferred}对象产生
 */
function Resolver() {
    /**
     * @method resolve
     *
     * 将当前对象状态设置为`resolved`，并执行所有成功回调函数
     *
     * @param {Mixed...} args 执行回调时的参数
     */
    this.resolve;

    /**
     * @method reject
     *
     * 将当前对象状态设置为`rejected`，并执行所有失败回调函数
     *
     * @param {Mixed...} args 执行回调时的参数
     */
    this.reject;
}
