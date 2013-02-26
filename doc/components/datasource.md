# 关于数据源

如[Model对象的文档](./Model.md)中所述，框架中的Model可以根据`datasource`属性的配置来加载数据。而该属性中的每一项，都是一个 **数据获取函数** 。

因此，框架内置了一些标准的 **数据获取函数** ，通过datasource对象提供。

datasource对象下的每一个方法，其返回值都是一个函数，因此称为 **数据获取函数工厂** ，可以通过函数式的编程，轻松地完成数据源的配置。

## 方法

现有的datasource对象提供以下几个方法。

### constant方法

`constant`方法用于得到一个 **数据获取函数** ，该函数单纯地返回一个给定的常量值，其签名如下：

    constance({Any} value)

#### 参数

- `{Any} value`：需要返回的常量值。

### remote方法

`remote`方法用于得到一个 **数据获取函数** ，该函数会发起一个XMLHttpRequest请求，向服务器获取数据，其签名如下：

    remote({string} url, {Object=} options)

#### 参数

- `{string} url`：加载数据的远程URL。
- `{Object} options`：调用`ajax.request`时的其它配置项。

### permission方法

`permission`方法用于得到一个 **数据获取函数** ，该函数会返回用户是否有给定的权限，其签名如下：

    permission({string} name)

#### 参数

- `{string} name`：权限的名称。