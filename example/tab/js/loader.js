(function() {
    var cache = {};

    window.define = function(id, factory) {
        var module = {
            exports: {}
        };
        var value = typeof factory === 'function'
            ? factory(require, module, module.exports)
            : factory;
        if (!value) {
            value = module.exports;
        }
        cache[id] = value;
    };

    window.define.amd = true;

    window.require = function(id, callback) {
        if (id instanceof Array) {
            id = id[0];
        }

        if (id.indexOf('./') === 0) {
            id = id.substring(2);
        }
        if (id.indexOf('er/') === 0) {
            id = id.substring(3);
        }
        var module = cache[id];
        if (callback) {
            setTimeout(function() { callback(module); }, 0);
        }
        else {
            return module;
        }
    };
}());