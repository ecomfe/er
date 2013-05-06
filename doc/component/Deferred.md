# Deferred对象

Deferred对象是一个通用对象，该对象是对[Promise/A规范](http://wiki.commonjs.org/wiki/Promises/A)的一个兼容实现，但有以下不足：

- 不支持`progress`相关的接口。
- 不提供 **interactive-promise** 相关的接口，即没有`get`和`call`方法。

该对象的实现可以通过[官方认可的测试用例](https://github.com/promises-aplus/promises-tests)。

除此之外，Deferred对象提供了一些额外的方法，用于快速地创建及操作Promise对象。

## 方法

### then方法

`then`方法即[Promise/A规范](http://wiki.commonjs.org/wiki/Promises/A)制定的`then`方法，但由于Deferred对象不支持`progress`相关的接口，因此其签名如下：

    then({function} done, {function=} fail)

#### 参数

- `{function} done`：成功时执行的回调函数。
- `{function=} fail`：失败时执行的回调函数。

#### 返回值

该函数会返回一个新的Promise对象，新Promise对象将有以下行为：

- 当原有Deferred对象进入 **resolved** 状态时，执行`done`回调函数，并根据函数的返回值进行逻辑。
- 当原有Deferred对象进入 **rejected** 状态时，执行`fail`回调函数，并根据函数的返回值进行逻辑。

其中 **根据函数的返回值进行逻辑** 具体如下：

- 当函数返回非`null`或`undefined`时，使用返回值进入 **resolved** 状态。
- 当函数抛出异常时，使用异常对象进入 **rejected** 状态。

另如果当前Deferred对象不处在 **pending** 状态，则：

- 如果处在 **resolved** 状态，则成功回调函数会被 **立即异步** 执行。
- 如果处在 **rejected** 状态，则失败回调函数会被 **立即异步** 执行。

### done、fail和always方法

`done`方法等效于调用`then`方法并传递`done`参数。

`fail`方法等效于调用`then`方法并传递`fail`参数。

`always`方法等效于调用`then`方法，并使用同一个函数作为`done`和`fail`参数。

### state属性

`state`方法用于获取当前Deferred对象的状态，一个Deferred有以下3种状态：

- **pending** ：该Deferred对象还在运行中，暂时没有结果。
- **resolved** ：该Deferred对象运行成功。
- **rejected** ：该Deferred对象运行失败。

### promise属性

`promise`属性得到一个Promise对象，一个Promise对象是对Deferred对象的只读表达，其包含了当前Deferred对象的以下方法：

- `done`
- `fail`
- `always`
- `then`

但并不包含操纵Deferred对象状态的方法，即`resolve`和`reject`方法。

### resolver属性

`resolver`属性得到一个Resolver对象，一个Resolver对象是对Deferred对象的只写表达，其包含了当前Deferred对象的以下方法：

- `resolve`
- `reject`

### syncModeEnabled属性

`syncModeEnabled`属性控制当前`Deferred`对象进入同步模式。

在同步模式下，`Deferred`对象并不符合Promise/A规范，当对象进入或处于**resolved**或**rejected**状态时，添加的回调函数会**立即**、**同步**地被执行。

### all静态方法

`all`方法接受多个Promise对象，用于管理并发的异步操作，其签名如下：

    all({Promise=} promise1, {Promise=} promise2, ... {Promise=} promiseN)

#### 返回值

并返回一个新的Promise对象。其返回的Promise对象有以下行为：

- 当所有提供的Promise对象都进入 **resolve** 状态后，该Promise对象进入 **resolve** 状态。
- 有一个或以上Promise对象进入 **rejected** 状态，则该Promise对象进入 **rejected** 状态。

当新的`Promise`对象触发时，将按照传入的`Promise`对象的顺序，依次提供参数，且根据原`Promise`对象的回调参数，有以下情况：

- 如果给定参数只有一个，使用这一个参数。
- 如果给定多个参数，则提供一个数组包含这些参数。

需要注意的是，哪怕有一个Promise进入了 **rejected** 状态，`all`方法返回的Promise对象依旧会等待其它所有Promise对象完成才进行状态的迁移，以保证逻辑执行的顺序性。

### isPromise静态方法

`isPromise`方法用于判断一个对象是否为Promise对象，其签名如下：

    isPromise({Any} value)

#### 参数

- `{Any} value`：用于判断的目标对象。

#### 返回值

如果`value`被认定为一个Promise对象，则返回 **true** 。

该方法并不会使用`instanceof`等手段进行类型检测，而是依赖特性检测进行判定。如果`value`对象有一个名字为`then`的方法，则直接认定`value`为Promise对象。