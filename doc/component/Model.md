# 关于Model

Model在ER框架中，定位于对 **数据的结构、加载、存储** 的封装。

需要注意的是，以前版本的ER框架，对Model只定位于 **数据结构** 上的封装，而实践证明，这样的定位会使系统不容易清晰切分，影响到可测性和可维护性等多个方面。在面向对象中，对一个 **对象** 的描述是 **属性和方法的封装** ，同理Model并不会只有属性而缺少相应的方法，而是要把 **存储、加载** 等一系列方法封装起来。

## 属性

### datasource属性

`datasource`属性是一个配置项，用于描述该Model加载数据的方案。

## 方法

### get方法

`get`方法用于获取当前Model对象的指定属性，其签名如下：

    get({string} name)

#### 参数

- `{string} name`：需要获取的属性名称。

#### 返回值

返回`name`对应的属性的值。如果不存在该属性，会返回 **undefined** 。

### set方法

`set`方法用于向当前Model对象设置属性，其有2种签名如下：

    set({Object} extension)
    set({string} name, {Any} value)

#### 参数

- `{Object} extension`：当`set`方法只传递一个参数时，将会把该参数中的所有属性依次添加到当前的Model中。
- `{string} name`：需要设置的属性的名称。
- `{Any} value`：需要设置的属性的值。

### remove方法

`remove`方法用于移除一个属性。

#### 参数

- `{string} name`：需要移除的属性名称。

#### 返回值

返回在属性被移除前，`name`对应的属性的值。如果不存在该属性，会返回 **undefined** 。

### getAsModel方法

`getAsModel`用于获取当前Model对象的一个属性，并且会将这个属性包装成为一个新的Model对象后返回，其签名如下：

    getAsModel({string} name)

#### 参数

- `{string} name`：需要获取的属性名称。

#### 返回值

`name`对应的属性的值被包装为一个新的Model对象返回。如果不存在该属性，会返回一个空（不包含任何属性）的Model对象。

### valueOf方法

Model对象重写了`valueOf`方法，该方法会返回一个对象，包含当前Model对象的所有属性。

`valueOf`方法返回的对象与当前Model对象管理的对象不同，是一个克隆副本，因此对返回的对象进行修改，并不会影响到当前的Model对象的结构。

### clone方法

`clone`方法将获得当前Model对象的一个副本。

### load方法

`load`方法是对数据的 **加载** 过程的封装，默认的实现将根据`datasource`属性的配置进行数据的加载。

### prepare方法

`prepare`方法在`load`方法完成后触发，用于对加载的数据进行进一步的处理。

在该方法执行时，所有通过`load`加载的数据已经填充到`this`对象中，可以使用`get`、`set`和`remove`方法进行调整。

如果在`prepare`方法中有异步的操作，可以让方法返回一个`Promise`对象。

## 关于datasource配置

`datasource`属性用于通过配置的方式完成数据的加载，其支持多种形式的加载方案。

`datasource`属性中的每一个配置，都是一个函数，在此称为 **数据获取函数** 。一个 **数据获取函数** 根据返回值的不同，有2种不同的行为：

- 如果返回一个`Promise`对象，则认为是一个异步获取过程，Model对象会等待该`Promise`对象进入 **resolved** 状态后，将给定的值添加到自身。
- 如果返回其它值，则认为是一个同步获取过程，Model直接将返回值添加到自身。

### 并发请求数据

通过一个对象配置并发的数据获取。对象中每一个属性对应一个获取函数，当数据获取后，会调用`this.set(name, result)`，以属性名为键值添加

    // 并发请求多个URL
    datasource = {
        'list': require('./datasource').remote('/model/list'),
        'config': require('./datasource').constant('listConfig')
    };

### 串行请求数据

通过一个数组配置并发的数据获取，数组中包含对象。将按照数组的顺序，依次加载每一个对象（对象中的各属性是并发）

    // 串行请求几个URL
    datasource = [
        { 'config': require('./datasource').constant('config') },
        { 'list': require('./datasource').remote('/model/list') }
    ];

注意使用该方案时，各对象中的键**不要相同**，否则会造成数据的覆盖。

### 嵌套配置

数组和对象可以相互嵌套，但有一个限制：

> 当一个对象中某个属性的值为普通对象（非数据加载配置项）或数组时，该属性名将不起作用，即不会在`Model`对象中存在以该属性名为键的值。

以下为一个串行和并行混杂的数据源配置：

    datasource = {
        'one': [getX, getY, getZ],
        'two': getA,
        'three': [
            { 'four': getB },
            { 'five': getC }
        ]
    };

以上对象将在最终的`Model`对象中生成 **two** 、 **four** 和 **five** 属性，而 **one** 、 **two** 和 **three** 因为属性值为普通对象或数组，将被忽略，其中 **one** 对应3个函数，将会把函数的返回值完全展开后添加到当前`Model`。

同样，注意在嵌套的同时，各属性名 **不要相同** ，除非该属性名称没用，以避免出现数据相互覆盖的情况。

### 通过数据获取配置项

上文所述的各种方案，均是数据获取配置项的一种简写，一个数据获取配置项包含以下内容：

- `{string} name`：数据加载后添加到`Model`对象时用的键值。
- `{function} retrieve`：获取数据的函数。
- `{boolean} dump`：如果该值为**true**，则`name`配置无效，完整添加获取的对象。

因此，可以使用数据获取配置项来处理一些例外情况，比如并行加载2个对象，且2个对象均无对应的键值，需要完整添加到`Model`对象：

    // 并行加载对象并完整添加到`Model`对象
    datasource = [
        {
            retrieve: require('./datasource').remote('/model/list'), 
            dump: true
        },
        {
            retrieve: require('./datasource').remote('/user/info'), 
            dump: true
        }
    ];

对于不同的简写，其与数据获取配置项的对应关系如下：

- 普通的函数，映射为`{ retrieve: {fn}, dump: true }`
- 对象中的一个属性，映射为`{ retrieve: {fn}, name: {name} }`

[Model加载示例](../../example/model)提供了一个简单的示例，展示如何使用配置式的方式进行数据的加载。