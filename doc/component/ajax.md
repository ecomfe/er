# AJAX模块

`ajax`模块封装了对`XMLHttpRequest`的基本操作，使用`Deferred`进行异步模型的统一，同时提供了大量的事件和扩展点。

## 方法

### {FakeXHR} request({Object} options)方法

ajax请求的基础方法，通过`options`对象传递相应的参数，返回一个`Promise`对象。

#### 参数

- `{Object} options`：调用ajax时的相应参数，包括：
    - `{string} options.url`：请求的地址，为必须项。
    - `{string=} options.method`：请求的类型， **GET** 或 **POST** ，没有提供 **PUT** 等的特殊处理，需要其它谓词请参考下文的`hooks`。
    - `{Object=} options.data`：请求的数据，为一个对象，使用 **GET** 请求时追回到url后面，其它请求放在请求体中发送。
    - `{string=} options.dataType`：返回数据的类型， **json** 或 **text** ，默认为 **text** 。如果该项的值为 **json** 但后端并没能返回合法的JSON字符串，则会由于数据解析失败导致请求失败，此时在`FakeXHR`对象上会有一个`error`属性记录处理数据时抛出的异常对象。
    - `{number=} options.timeout`：超时时间，毫秒为单位，默认不设超时。
    - `{boolean=} options.cache`：决定是否允许缓存，如不使用缓存，则添加一个键为`_`的字段，默认开启缓存。

#### 返回值

返回一个`FakeXHR`对象，一个`FakeXHR`对象是一个特殊的`Promise`对象，除了`Promise`拥有的方法外，额外提供以下方法和属性：

- `{void} abort()`：中断当前请求。
- `{void} setRequestHeader({string} name, {string} value)`：设置请求头，只可在`beforeSend`钩子中可用，参考下文的`hooks`。
- `{number} readyState`：当前的状态编码。
- `{number} status`：响应的HTTP状态码。
- `{string} responseText`：返回的字符串。
- `{string} responseXML`：返回的XML文档。

当ajax请求成功时，这个`FakeXHR`进入 **resolved** 状态，相应的回调函数接受返回的数据为参数，回调函数中的`this`即为`FakeXHR`对象。

当ajax请求失败时，这个`FakeXHR`进入 **rejected** 状态，相应的回调函数接受该`FakeXHR`对象为参数。

### {FakeXHR} get({string} url, {Object} data, {boolean} cache)方法

相当于调用`request`方法，并指定`method`为 **GET** 。

### {FakeXHR} getJSON({string} url, {Object} data, {boolean} cache)方法

相当于调用`request`方法，并指定`method`为 **GET** ，`dataType`为 **json** 。

### {FakeXHR} post({string} url, {Object=} data)方法

相当于调用`request`方法，并指定`method`为 **POST** 。

### {void} log({string} url, {Object=} data)方法

该方法采用一个`<img>`标签发送请求，不确保发送成功，没有任何回调和通知，用于跨域发送一次不那么重要的日志信息。

## 全局事件

### done事件

当任意一个ajax请求成功时触发，可用来追踪全系统的请求，事件对象属性如下：

- `{FakeXHR} xhr`：管理请求的`FakeXHR`对象。

### fail事件

当任意一个ajax请求失败时触发，可用来提示用户错误信息等，事件对象属性如下：

- `{FakeXHR} xhr`：管理请求的`FakeXHR`对象。

## 全局钩子

ajax模块提供了几个全局钩子，在一次请求的流程中会被依次调用，可在各个阶段执行额外的逻辑或调整请求的流程。

### beforeExecute

在执行逻辑以前，参数如下：

- `{Object} options`：请求时传入的参数。

该钩子可用来设置一些全局的配置，如下代码让全局所有请求默认使用 **GET** 请求，同时默认返回JSON，可被单次调用覆盖：

    ajax.hooks.beforeExecute = function (options) {
        if (!options.method) {
            options.method = 'GET';
        }
        if (!options.dataType) {
            options.dataType = 'json';
        }
    }

### beforeCreate

在创建`XMLHttpRequest`前，参数如下：

- `{Object} options`：请求时的参数外加默认参数融合后的对象。
- `{Deferred} request`：控制请求的`Deferred`对象。

如果该函数返回 **true** 则表示请求已经处理，ajax模块将不再进行后续的逻辑。

该钩子可用于支持请求，使用前端的模拟数据给予返回，支持前端的调试和测试。如下代码将支持指向 **/user/count** 的请求，模拟4秒的延迟并返回一个稳定的数字作为响应：

    ajax.hooks.beforeCreate = function (options, request) {
        if (options.url === '/user/count') {
            setTimeout(
                function () {
                    request.resolve(123); // 返回一个固定的数字
                },
                4000 // 延迟4秒
            );
            return true; // 返回true表示已经处理完成
        }
    };

### beforeSend

`XMLHttpRequest`链接打开但没发送数据，参数如下：

- `{FakeXHR} xhr`：伪造的`XMLHttpRequest`对象。
- `{Object} options`：：请求时的参数外加默认参数融合后的对象。

该钩子是唯一可以向`XMLHttpRequest`设置请求头的时机，如下代码可在HTTP层全局禁用缓存：

    ajax.hooks.beforeSend = function (xhr) {
        xhr.setRequestHeader('Cache-Control', 'no-cache');
    };

### afterReceive

在收到服务器的返回后，参数如下：

- `{FakeXHR} xhr`：伪造的`XMLHttpRequest`对象。
- `{Object} options`：：请求时的参数外加默认参数融合后的对象。

该钩子可以用来做一些敏感词过滤之类的逻辑，通常不常用：

    ajax.hooks.afterReceive = function (xhr, options) {
        xhr.responseText = xhr.responseText.replace(/fuck/ig, '****');
    };

### afterParse

在按数据类型处理完响应后，参数如下：

- `{*} data`：返回的数据，根据`dataType`配置可能是对象或字符串。
- `{FakeXHR} xhr`：伪造的`XMLHttpRequest`对象。
- `{Object} options`：：请求时的参数外加默认参数融合后的对象。

该钩子的返回值将被作为最终触发回调时的数据。如果该钩子抛出异常，则无论请求是否成功，均视为失败，将异常信息作为`error`属性依附在`FakeXHR`对象上传递给回调函数。

该钩子用于处理全局前后端约定的数据格式，如下代码表示在系统中所有后端返回的JSON串均具备一定的结构，但前端只需要特定的部分：

    ajax.hooks.afterParse = function (data) {
        // 约定为{ success: true/false, result: { ... } }
        if (data.success) {
            return data.result;
        }
        else {
            // 请求失败时统一有`message`
            showGlobalWarning(data.message);
            throw data.message; // 通过抛异常提示请求失败
        }
    }