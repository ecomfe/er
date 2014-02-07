/**
 * @class meta.Difference
 *
 * 表示一个字段的差异的对象
 */
function Difference() {
    /**
     * @property {string} key
     *
     * 差异字段的名称
     */
    this.key;

    /**
     * @property {Mixed} self
     *
     * 自身字段的值
     */
    this.self;

    /**
     * @property {Mixed} other
     *
     * 比对对象的字段的值
     */
    this.other;
}
