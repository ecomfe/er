/**
 * @class meta.DatasourceOption
 *
 * 数据模型数据源配置项
 *
 * 用于{@link Model#datasource}的配置
 */
function DatasourceOption() {
    /**
     * @property {string} name
     *
     * 对应的属性名称
     *
     * 如果此配置项的值是一个数组或非`meta.DatasourceOption`对象，
     * 那么`name`属性是不起作用的，仅仅是为了符合javascript的语法而做的占位符
     */
    this.name;

    /**
     * @method retrieve
     *
     * 获取数据的方法
     *
     * @param {Model} model 当前的{@link Model}对象
     * @param {meta.DatasourceOption} option 当前属性对应的配置项
     * @return {Mixed | meta.Promise} 如果方法返回一个{@link meta.Promise}对象，
     * 则等待该对象进入`resolved`状态，将进入`resolved`状态时的参数作为数据。
     * 如果是其它类型的对象，则直接作为数据使用
     */
    this.retrieve;

    /**
     * @property {boolean} [dump=false]
     *
     * 指定是否展开数据
     *
     * 如果此配置为`true`，则{@link meta.DatasourceOption#name}配置无效，
     * 由{@link meta.DatasourceOption#retrieve}获得的数据将
     * 直接展开到当前@{link Model}对象上
     *
     * 需要注意的是，如果此属性为`true`而获得的数据不是对象类型，则可能出现不可预期的情况
     */
    this.dump;
}
