# URL对象

ER框架提供的URL对象实现了URL的分解、参数分析等功能，但并不是针对标准的URL规则进行，而是为ER的URL导航而服务，只针对hash部分定义了自有的一个解析方案。

该解析方案与URL的规则相近，但存在一些区别：

- 没有 **协议** 、 **域名** 、 **端口** 和 **hash**这几部分，仅有 **路径** 和 **参数** 部分。
- **路径** 和 **参数** 部分默认使用 **~** 符号进行分隔。

其它部分，如 **参数** 部分的分隔符使用 **=** 和 **&** 符号，以及URL转义的规则，均与标准的URL相同。

## 方法

### 构造函数

URL对象的构造函数接受URL的组成部件并完成解析，生成一个只读的对象，其签名如下：

    URL({string=} path, {string=} search, {string=} searchSeparator)

#### 参数

- `{string=} path`：URL的路径部分，如果为空，则默认值为 **/** 。
- `{string=} search`：URL的参数部分。
- `{string=} searchSeparator`：用于分隔路径和参数部分的分隔符，默认值为 **~** 。

注意， **不建议使用该构造函数** ，需要创建URL实例，可以使用其静态工厂方法`parse`和`withQuery`。

在构造后的URL实例中，有对应的`getPath()`和`getSearch()`方法可获取路径和参数部分的字符串值，同时URL对象重写了`toString()`方法，因此转换为字符串时，会返回一个完整的URL字符串值。

### getQuery方法

`getQuery`方法可获取URL实例中的参数，其签名如下：

    getQuery({string=} key)

#### 参数

- `{string=} key`：需要获取的参数的键名。如果没有`key`，则会将整个参数对象导出。

如果不提供`key`参数直接调用`getQuery()`，则会给一个参数对象的 **副本** 。该对象包含了URL的所有参数，但修改该对象不会影响原有的URL实例。

### parse静态方法

`parse`方法用于将一个字符串分解为URL实例，其签名如下：

    parse({string=} url, {Object=} options)

#### 参数

- `{string} url`：完整的URL。
- `{Object=} options`：控制解析行为的相关参数。

其中`options`参数可包含以下属性：

- `{string} querySeparator`：用于指定分隔path和search的字符。

#### 返回值

该方法返回一个URL实例。

### withQuery静态方法

`withQuery`方法用于根据已有的URL，以及一系列额外的参数，生成一个URL实例，其签名如下：

    withQuery({string=} url, {Object} query, {Object=} options)

#### 参数

- `{string} url`：完整的URL。
- `{Object} query`：额外的参数，其中的键即为参数名称，值为参数值。
- `{Object=} options`：控制解析行为的相关参数，可包含的属性参考`parse`方法的说明。

#### 返回值

该方法返回一个URL实例。

### parseQuery静态方法

`parseQuery`方法用于将一个参数字符串解析为参数对象，其签名如下：

    parseQuery({string} str)

该方法不考虑同名参数多次出现的问题，当一个参数在字符串中没有对应值时，在返回的参数对象中的值为 **true** 。

#### 参数

- `{string} str`：参数字符串，不能有起始的 **?** 或 **~** 字符。

#### 返回值

该方法返回一个对象，包含了从`str`解析得到的参数对象。

### serialize静态方法

`serialize`方法为`parseQuery`方法的反向工作，会将一个参数对象转为参数字符串，其签名如下：

    serialize({Object} query)

#### 参数

- `{Object} query`：参数对象。

#### 返回值

该方法返回一个字符串，包含了`query`对象指定的参数。

### empty静态属性

`empty`属性代表一个空的URL实例，可以使用`URL.empty`获得，以减少太多`new URL()`的调用。