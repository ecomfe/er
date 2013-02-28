# 关于Action

Action对象在MVC框架中，是一个承载着业务逻辑的角色。在一个完整的MVC体系下，Action与Model和View进行交互，负责协调两者来完成一系列的业务逻辑。

## 属性

### context属性

`context`属性包含了当前Action执行的上下文，其信息来自于controller对象，至少包含以下属性：

- `{URL} url`：访问当前Action的URL对象。
- `{URL=} referrer`：来源URL对象，如果没有来源URL，则该属性的值为 **null** 。
- `{string container}`：用于展现视图的DOM容器的id。

### modelType属性

`modelType`属性用于指定该Action对应的Model的类型。Model类型为一个构造函数，在Action的生命周期中，如果该属性存在，则会使用`new`关键字对其进行实例化并使用。

### viewType属性

`viewType`属性用于指定该Action对应的View类型。View类型为一个构造函数，在Action的生命周期中，如果该属性存在，则会使用`new`关键字对其进行实例化并使用。

## 方法

### enter方法

`enter`方法是Action的生命周期的入口，有一个健壮的默认实现，正常情况下不需要重写该方法，其签名如下：

    enter({Object} context)

#### 参数

- `{Object} context`：访问当前Action的上下文，具体内容参考`context`属性的描述。

#### 返回值

该方法返回一个Promise对象，在`enter`的执行完成后，会将该Promise对象置为 **resolved** 状态。

通常在编程过程中，不需要关心这个Promise对象，仅在测试的时候，为了保证`enter`执行完毕再运行相关的测试用例，才会使用该方法的返回值。

### forwardToView方法

`forwardToView`方法用于Action在加载了Model之后，进入到View相关的逻辑，默认不需要重写该方法。

### initBehavior方法

`initBehavior`方法在View渲染完毕后执行，用于初始化与View的交互逻辑，如注册View的相关事件等。

`initBehavior`方法是Action生命周期的一个重要扩展点，通常Action在基于`modelType`和`viewType`进行配置后，只需要重写`initBehavior`方法来完成View和Model的协调和交互，即可以实现业务逻辑。

### leave方法

`leave`方法是当Action退出时执行的，用于销毁一些关键性的数据（如DOM元素的引用等），以防止内存泄漏的发生。

`leave`方法的默认实现会对Model和View进行销毁处理，假设Model或View有`dispose`方法，则调用该方法用于进一步释放资源。

### createModel方法

如果`modelType`配置不足以支持关联的Model对象的创建，则可以重写`createModel`方法，该方法必须返回一个Model对象。

### createView方法

如果`viewType`配置不中心支持关联的View对象的创建，则可以重写`createView`方法，该方法必须返回一个View对象。

## 关于Model和View

Action并没有对Model和View使用`instanceof`运算符进行类型的判断，而是使用特性检测的方式来确定对Model和View的使用。

其中对于Model，有以下几种情况：

- Action可以没有Model，此时让`createModel`方法返回空值即可。
- Model可以是一个纯粹的对象，由`createModel`方法返回即可。
- 如果`createModel`方法返回的对象包含一个名称为`load`的方法，则会调用该方法。该方法必须返回一个`Promise`对象，Action等待该`Promise`对象进入 **resolved** 状态，随后开始处理View相关的逻辑。
- 对于最复杂的情况，使用框架提供的Model类的实例来处理数据的加载。

对于View，可以是任意包含一个名称为`render`的方法的对象。在`render`方法被调用时，该对象会被赋予2个属性：

- `{Object} model`：当前Action持有的Model对象将被传递给View。
- `{string} container`：用于渲染该View的容器DOM元素的id。

View只需根据这2个属性，从`model`获取数据，将内容显示在`container`表示的DOM元素内即可。

## Action的生命周期

1. 调用`enter`方法开始生命周期。
2. 触发`enter`事件。
3. 使用`createModel`方法获取关联的Model对象。
4. 执行`this.model.load()`加载数据，并等待数据加载完毕。
5. 执行`forwardToView`方法开始处理View相关的逻辑。
6. 触发`modelloaded`事件。
7. 调用`createView`方法获取关联的View对象。
8. 触发`beforerender`事件。
9. 执行`this.view.render()`渲染视图。
10. 触发`rendered`事件。
11. 调用`initBehavior`方法。
12. 触发`entercomplete`事件。
13. 用户的操作和交互。
14. 调用`leave`方法开始退出Action。
15. 触发`beforeleave`事件。
16. 如果Model有`dispose`方法，则执行`this.model.dispose()`销毁Model对象。
17. 如果View有`dispose`方法，则执行`this.view.dispose()`销毁View对象。
18. 触发`leave`事件。

## 关于伪Action

与Model和View同样，ER框架也没有强制要求所有的Action继承于框架提供的Action类。

在ER框架中，Action是可以任意包含一个名称为`enter`方法的对象。在`enter`方法被调用时，会将`context`属性传递。

因此，对于简单的业务的开发，可以使用单纯的对象来作为Action并注册到controller对象上。