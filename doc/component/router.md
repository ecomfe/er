# router对象

router对象称为路由器，但与普通的MVC框架中的路由器有着显著的不同。在普通的MVC框架中，router负责根据URL及参数等上下文信息，定位需要执行的controller对象，用于调度请求和响应之间的关系。

在ER框架中，由于核心精简和独立可用的要求，router对象并不负责与controller有关的任何逻辑。在ER框架中，router负责 **将URL与一个具体的函数进行映射** 。router会通过自身注册的映射关系，针对不同的URL，执行不同的函数。

在引入router对象后，该对象会 **自动开始工作** ，其工作模式为监听locator对象的`redirect`事件，并针对URL进行路由逻辑

## 方法

### start方法

`start`方法指定router对象开始工作。

如果一个系统同时使用locator、router和controller对象，则其启动顺序应当是 **controller -> router -> locator** 。

### add方法

`add`方法用于添加一个路由规则，其签名如下：

    add({string|RegExp} rule, {function} handler)

#### 参数

- `{string|RegExp} rule`：判定URL是否匹配的规则
- `{function} handler`：当URL匹配时，执行的函数

### setBackup方法

`setBackup`方法用于添加一个后备的处理函数，当URL无法匹配在router对象中注册的所有规则时，会调用该处理函数，其签名如下：

    setBackup({function} handler)

#### 参数

- `{function} handler`：需要执行的函数

## 关于规则

在router对象中，一个URL匹配规则由2种类型：

- 当规则是一个字符串时，如果URL中的 **path** 部分与该字符串完全相等，则认为规则匹配成功。
- 当规则是一个正则表达式时，如果URL中的 **path** 部分可以通过该正则表达式的检查，则认为规则匹配成功。

## 关于优先级

在router对象中，如果注册多个相同或相互有重叠的规则，是允许的。在这种情况下， **先注册的规则将被执行** 。

因此，在一些场合下，可以先注册若干个字符串的规则，再将一个正则表达式的规则作为一种 **后备规则**，形成一个完善的路由，如下代码：

    router.add('/fruits/apple', showDiscountedPrice);
    router.add('/fruits/orange', showDiscountedPrice);
    router.add(/\/fruits\/(\w+)/, showPrice);

以上代码将 **apple** 和 **orange** 特殊处理，显示一个折扣后的价格，而其它水果则显示普通的价格。