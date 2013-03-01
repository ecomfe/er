/*jshint unused: false */
function delayed(time, value) {
    return function() {
        var Deferred = require('Deferred');
        log('开始获取值 ' + value);
        var loading = new Deferred();
        setTimeout(
            function() {
                log('已获取值 ' + value);
                loading.resolve(value);
            },
            time
        );
        return loading.promise();
    };
}

function relied(time, key) {
    return function(model) {
        var Deferred = require('Deferred');
        log('开始获取已有Model中的 ' + key);
        var loading = new Deferred();
        setTimeout(
            function() {
                log('已经获取已有Model中的 ' + key);
                loading.resolve(model.get(key));
            },
            time
        );
        return loading.promise();
    };
}

function immediate(value) {
    return function() {
        log('直接获取值 ' + value);
        return value;
    };
}