/**
 * @class meta.ChangeRecord
 *
 * 属性变化记录项，用于{@link Model#change}事件
 */
function ChangeRecord() {
    /**
     * @property {string} type
     *
     * 变化的类型，可能为`"add"`、`"remove"`或`"change"`
     */
    this.type;

    /**
     * @property {string} name
     *
     * 发生变化的属性的名称
     */
    this.name;

    /**
     * @property {Mixed} oldValue
     *
     * 属性的原值，如果{@link meta.ChangeRecord#type}为`"add"`，
     * 则此属性的值必定为`undefined`
     */
    this.oldValue;

    /**
     * @property {Mixed} newValue
     *
     * 属性的新值，如果{@link meta.ChangeRecord#type}为`"remove"`，
     * 则此属性的值必定为`undefined`
     */
    this.newValue;
}
