# controller对象

controller对象负责通过router对象，将指定的URL分发到目标Action的执行上，是完整的MVC开发体系中的核心环节。

controller对象同时还负责根据Action和访问参数反向生成URL，以便生成链接等元素。

## 方法

### start方法

`start`方法指定controller对象开始工作。

如果一个系统同时使用locator、router和controller对象，则其启动顺序应当是 **controller -> router -> locator** 。

### registerAction方法

`registerAction`方法向controller对象注册一个Action的配置，其签名如下：

    registerAction({Object} config)

#### 参数

- `{Object} config`：Action的配置项。

其中`config`参数可包含以下属性：

- `{string} path`：必须有，指定Action对应的URL路径。
- `{Array<string>|string} authority`：权限配置，控制用户是否可以访问该Action。
- `{string} type`：指定Action对应实现的模块id，controller将使用AMD规范加载该id代表的模块。
- `{string} noAuthorityLocation`：指定当用户无权限访问该Action时，跳转的路径，controller对象将再将根据该属性指定的路径寻找Action。
- `{string} movedTo`：指定Action的跳转关系，常用于系统的迁移和升级，controller发现有该属性时，将根据该属性指定的路径寻找Action。
- `{boolean} childActionOnly`：指定只能作为子Action加载，当主Action访问该路径时，此配置会被忽略。可以用`childActionOnly: !window.DEBUG`来设定允许调试状态下直接访问，但生产环境中不能访问。

#### 参数

- `{string} actionType`：Action实现的模块id，与`registerAction`中的`config`配置项中的`path`路径相同。
- `{Object=} query`：追加在URL后的参数，如果传递空值则视为没有参数。

#### 返回值

返回一个URL对象，通过该URL对象可以访问指定的Action。如果没有找到`actionType`参数对应的Action，则会返回一个空的URL对象。

### resolveActionConfig方法

`resolveActionConfig`用于处理系统找到的Action配置对象。

在系统通过默认的逻辑查找Action配置后，会将查找到的配置对象，以及进入当前路径时的参数传递给这个方法，可以重写该方法以进一步处理。

如下代码，实现一种默认的映射，按路径来获得模块名，可以免除Action的配置：

    controller.resolveActionConfig = function (config, args) {
        // 如果已经找到了就不用特别处理了
        if (config) {
            return config;
        }

        var path = args.url.getPath(); // 找到路径
        if (path.indexOf('/') === 0) {
            path = path.substring(1);
        }

        var parts = path.split('/');
        // 由于Action是个类，模块名是大写开始的，而路径是小写开始的，因此转换一下
        var moduleName = parts[parts.length - 1];
        moduleName = moduleName.charAt(0).toUpperCase() + moduleName.substring(1);
        parts[parts.length - ] = moduleName;

        // 返回的对象中必须有type属性以便加载对应的模块
        return {
            path: '/' + path,
            type: parts.join('/')
        };
    }

#### 参数

- `{Object | null} config`：系统通过默认逻辑找到的配置项对象，如未找到对应的配置则会是null。
- `{Object} args`：进入当前路径时的参数，包含以下内容：
    - `{URL} url`：当前路径对应的URL对象
    - `{URL} referer`：前一次的路径，如果没有则是`null`。
    - `{string} container`：放置Action的DOM容器的id。
    - `{boolean} isChildAction`：是否子Action。

#### 返回值

方法 **必须** 返回一个合法的Action配置对象，或返回`null`表示无对应的Action配置。

一个 **合法的Action配置对象** 至少包含`type`属性用于指定对应的模块路径。具体参考以下章节。

## 关于Action配置

### 普通Action

正常的Action配置指定`path`和`type`即可，如：

    {
        path: '/user/list', // 路径
        type: 'user/List' // AMD模块id
    }

### 静态参数

在配置中使用`args`属性可以指定一些静态参数，这些参数会传递给Action，可在`Action.context`中获得。由于Action默认会将`context`推送到`Model`对象中，因此也可以使用`model.get`获取，如：

    {                                   {
        path: '/user/create',               path: 'user/update',
        type: 'user/Form',                  type: 'user/Form', // 共用一个模块
        args: { formType: 'create' }        args: { formType: 'update' } // 用参数来区分
    }                                   }

则可以在Action的代码中：

    if (this.model.get('formType') === 'create') {
        // 向服务器发送PUT请求
    }
    else {
        // 发送POST请求
    }

### 权限配置

可以通过`authority`属性配置权限，`authority`属性有两种形式：

- 可以是一个数组，此时用户拥有数组中任意一项权限即认为有权限。
- 可以是个字符串，将各权限通过 **|** 字符分割。

当没有相应权限的用户访问该路径时，可以通过`noAuthorityLocation`属性设定其跳转至特定的路径。同时在 **config** 对象中，也可以配置`noAuthorityLocation`属性，用于全局的没有权限时的跳转路径。

通过以下方式即配置一个仅有 **VIEW_USER_LIST** 或 **EDIT_USER_LIST** 权限的用户可以访问的Action，同时对于没有权限的用户，将跳转到 **/user/403** 这一路径：

    {
        path: '/user/list', // 路径
        type: 'user/List', // AMD模块id
        noAuthorityLocation: '/user/403', // 无权限跳转路径
        authority: ['VIEW_USER_LIST', 'EDIT_USER_LIST'] // 权限
        // 也可以用
        // authority: 'VIEW_USER_LIST|EDIT_USER_LIST'
    }

### Action跳转

在系统的升级和迁移时，有时需要将一个Action迁移到另一个Action中，导致URL的变化。但是为了保证系统的可访问性，原有Action的URL是需要保留的，应当相应地跳转到新的Action中。

在普通多页面式应用的实现过程中，通常会在服务器配置一个跳转（HTTP状态码301/302）来实现，ER框架也实现了类似的功能。通过`movedTo`属性可以指定一个Action跳转至另一个路径，如：

    {
        path: '/usr/list',
        movedTo: '/user/list'
    }

当配置项中有`movedTo`属性时，不再需要`type`属性。在这一情况下，controller对象会再次根据 **/user/list** 这个路径查找Action，并加载对应的模块执行。

应当注意的时，在配置`movedTo`属性时，要 **注意避免产生循环跳转** ，controller对象并不会处理这种情况。

## 关于加载Action过程中的跳转

需要注意的是，在Action的加载过程中，有多种情况会导致路径的跳转，如：

- 配置了`noAuthorityLocation`且没有权限访问该Action。
- 配置了`movedTo`属性。
- 找不到指定的路径对应的Action配置项而需要跳转到404页面。

在这类跳转过程中，controller并 **不会尝试修改URL** ，原因是如果修改了URL，使用浏览器的后退功能，会产生一个无限的循环而影响系统的可用性。因此controller选择在内部实现多次的路径查找，得到最终的Action，而浏览器地址栏中的URL是不会有任何变化的。

## 关于404页面

当一个路径没有对应的Action配置时，controller对象将执行重定向到404页面的逻辑。

这时，controller对象将会获取 **config** 对象下的`notFoundLocation`全局配置，并根据这个配置指定的路径进行Action的查找。

与其它的跳转不同的是，如果`notFoundLocation`全局配置对应的Action也不存在，则controller会抛出一个异常。因此对于任何一个系统， **必须配置`notFoundLocation`指定的路径对应的Action** 。