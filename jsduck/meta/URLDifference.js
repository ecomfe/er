/**
 * @class meta.URLDifference
 *
 * 表示2个URL的差异的对象
 */
function URLDifference() {
    /**
     * @property {boolean | meta.Difference} path
     *
     * 表达URL的`path`部分的差异，如果没有差异则值为`false`
     */
    this.path;

    /**
     * @property {boolean | Object} query
     *
     * 表达URL的`query`部分的差异，如果没有差异则值为`false`。
     * 如果存在差异，则该属性的键为存在差异的字段名称，
     * 值为一个{@link meta.Difference}对象
     */
    this.query;

    /**
     * @property {meta.Difference[]} queryDifference
     *
     * 存放URL的`query`部分的所有差异的数组
     */
    this.queryDifference;
}