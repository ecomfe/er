/**
 * @class meta.ActionConfig
 *
 * Action配置类，用于配置URL至Action的映射其权限等内容
 */
function ActionConfig() {
    /**
     * @property {string} url
     *
     * 配置对应的URL，不包含任何参数，框架用URL的`path`部分与此进行相等比对
     *
     * URL配置是 **大小写敏感** 的
     */
    this.url;

    /**
     * @property {string} type
     *
     * 对应的Action模块id，必须使用 **全局模块id**
     */
    this.type;

    /**
     * @property {string | string[] | Function} [authority]
     *
     * 配置进入Action的权限，可以为3种类型：
     *
     * - 使用字符串数组，数组中每一项表示一个权限
     * - 使用单一字符串，多个权限可用`|`分隔，`|`前后的空格会被忽略（即带有`trim`效果）
     * - 使用函数，则函数接受以下参数：
     *
     *     - `{meta.ActionContext} context`：当前的{@link meta.ActionContext}对象
     *     - `{meta.ActionConfig} config`：当前的{@link meta.ActionConfig}对象
     *
     *     函数返回`true`则认为权限检验通过，否则认为没有权限
     *
     * 权限采用 **或** 的关系，即用户有其中任何一个权限均能够进入该Action
     *
     * 系统使用{@link permission#isAllow}简单地判断权限是否合法
     *
     * 没有此配置则认为不对权限进行控制，任何用户均可访问
     */
    this.authority;

    /**
     * @property {string} [noAuthorityLocation]
     *
     * 配置用户没有权限时，系统将跳转到哪个地址
     *
     * 如果没有此配置，则使用{@link config#noAuthorityLocation}作为默认值
     */
    this.noAuthorityLocation;

    /**
     * @property {string} [movedTo]
     *
     * 指定Action的迁移路径
     *
     * 如果有此配置，则{@link meta.ActionConfig#type}没有作用，
     * 系统将直接重定向到此配置指定的路径
     *
     * 此配置通常用于系统模块的迁移，但同时希望保留原URL以提高旧用户可访问性，
     * 也可使用此配置来实现多个URL对应一个Action，如为实体提供别名等
     */
    this.movedTo;

    /**
     * @property {boolean} [childActionOnly=false]
     *
     * 指定Action是否仅能被作为子Action加载
     *
     * 如果此配置为`true`，则不能通过修改浏览器地址栏来进入此Action，
     * 仅能通过{@link Controller#renderChildAction}来进入此Action
     *
     * 通常在开发期间我们希望可以直接在地址栏中输入地址调试Action，而上线后则不允许如此，
     * 因此建议每个系统都有一个类似`window.DEBUG`的开关，
     * 而此配置项可以写为`childActionOnly: !window.DEBUG`来提供开发与生产环境的兼容性
     */
    this.childActionOnly;

    /**
     * @property {string} [title]
     *
     * 配置进入此Action时，浏览器标题栏显示的内容
     *
     * 如果是子Action，则此配置无效
     *
     * 如果没有此配置项，则使用{@link config#systemName}作为默认值
     */
    this.title;

    /**
     * @property {Object} args
     *
     * 提供进入Action时，在{@link meta.ActionContext}之外，额外通过`context`参数
     * 传递给{@link Action#method-enter}方法的数据
     *
     * 此配置可以用来为一个相对复杂的Action区分当前的环境，如一个表单Action同时支持
     * 一个实体的创建和更新两种操作，则可以进行这样的配置：
     *
     *     {
     *         url: '/user/create',
     *         type: 'user/Form',
     *         args: { formType: 'create' }
     *     }
     *
     *     {
     *         url: '/user/update',
     *         type: 'user/Form',
     *         args: { formType: 'update' }
     *     }
     *
     * 而`user/Form`模块中则可以根据`formType`使用不同的逻辑：
     *
     *     if (this.model.get('formType') === 'update') {
     *         var id = this.model.get('id'); // URL中的id参数
     *         // 从服务器加载已经存在的实体
     *         ajax.get('/users/' + id)
     *             .then(util.bind(this.model.fill, this.model));
     *     }
     */
    this.args;
}
