/**
 * @class meta.Promise
 *
 * 社区[Promise/A](http://wiki.commonjs.org/wiki/Promises/A)规范的实现
 *
 * 此对象不能直接创建，须通过{@link Deferred}对象产生
 */
function Promise() {

    /**
     * @method then
     *
     * 添加成功回调函数及可选的失败回调函数
     *
     * 该函数会返回一个新的`Promise`对象，新`Promise`对象将有以下行为：
     *
     * - 当原有`Promise`对象进入`resolved`状态时，执行`done`回调函数，
     *   并根据函数的返回值进行逻辑
     * - 当原有`Promise`对象进入`rejected`状态时，执行`fail`回调函数，
     *   并根据函数的返回值进行逻辑
     *
     * 其中 **根据函数的返回值进行逻辑** 具体如下：
     *
     * - 当函数返回非`null`或`undefined`时，使用返回值进入`resolved`状态
     * - 当函数抛出异常时，使用异常对象进入`rejected`状态
     *
     * 另如果当前`Promise`对象不处在`pending`状态，则：
     *
     * - 如果处在`resolved`状态，则成功回调函数会被立即异步执行
     * - 如果处在`rejected`状态，则失败回调函数会被立即异步执行
     *
     * @param {Function} [done] 成功时执行的回调函数
     * @param {Function} [fail] 失败时执行的回调函数，可选参数
     * @return {meta.Promise} 新的`Promise`对象
     */
    this.then;

    /**
     * @method done
     *
     * 添加一个成功回调函数
     *
     * 本方法相当于`.then(callback, null)，
     * 具体参考{@link meta.Promise#then}方法的说明
     *
     * @param {Function} callback 需要添加的回调函数
     * @return {meta.Promise} 新的`Promise`对象
     */
    this.done;

    /**
     * @method fail
     *
     * 添加一个失败回调函数
     *
     * 本方法相当于`.then(null, callback)，
     * 具体参考{@link meta.Promise#then}方法的说明
     *
     * @param {Function} callback 需要添加的回调函数
     * @return {meta.Promise} 新的`Promise`对象
     */
    this.fail;

    /**
     * @method ensure
     *
     * 添加一个无论成功还是失败均执行的回调函数
     *
     * 本方法相当于`.then(callback, callback)，
     * 具体参考{@link meta.Promise#then}方法的说明
     *
     * @param {Function} callback 需要添加的回调函数
     * @return {meta.Promise} 新的`Promise`对象
     */
    this.ensure;

    /**
     * @method thenGetProperty
     *
     * 添加一个回调函数，返回`resolve`对象的指定属性
     *
     * @param {string} propertyName 指定的属性名
     * @return {meta.Promise} 新的`Promise`对象
     */
    this.thenGetProperty;

    /**
     * @method thenReturn
     *
     * 添加一个回调函数，返回指定的值
     *
     * @param {*} value 指定的值
     * @return {meta.Promise} 新的`Promise`对象
     */
    this.thenReturn;

    /**
     * @method thenBind
     *
     * 添加一个回调函数，可指定函数执行时的`this`对象以及额外参数
     *
     * @param {Function} handler 需要执行的回调函数
     * @param {Object} thisObject 指定的`this`对象
     * @parma {*...} args 额外参数
     * @return {meta.Promise} 新的`Promise`对象
     */
    this.thenBind;

    /**
     * @method thenSwallowException
     *
     * 添加一个回调函数，将所有的异常静默处理
     *
     * 此方法相当于添加一个空函数作为`reject`函数
     *
     * @return {meta.Promise} 新的`Promise`对象
     */
    this.thenSwallowException;
}
