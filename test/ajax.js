define(function (require) {
    var ajax = require('er/ajax');

    describe('ajax', function () {
        it('should be an object', function () {
            expect(ajax).toBeOfType('object');
        });

        describe('request method', function () {
            it('should exists', function () {
                expect(ajax.request).toBeOfType('function');
            });

            it('should resolve the returned promise when content is retrieved', function (done) {
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading.then(function (data) {
                    try {
                        expect(data).toBe('{ "x": 1 }');
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });

            it('should parse a json string to an object when `dataType` is set to `json', function (done) {
                var options = {
                    url: './asset/res/x.json',
                    dataType: 'json',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading.then(function (data) {
                    try {
                        expect(data).toEqual({ x: 1 });
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });
        });

        describe('hooks', function () {
            it('should be an object', function () {
                expect(ajax.hooks).toBeOfType('object');
            });

            beforeEach(function () {
                delete ajax.hooks.beforeExecute;
                delete ajax.hooks.beforeCreate;
                delete ajax.hooks.beforeSend;
                delete ajax.hooks.afterReceive;
                delete ajax.hooks.afterParse;
            })

            it('should be able to add options with `beforeExecute`', function (done) {
                ajax.hooks.beforeExecute = function (options) {
                    options.dataType = 'json';
                };
                spyOn(ajax.hooks, 'beforeExecute').andCallThrough();
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading.then(function (data) {
                    try {
                        expect(ajax.hooks.beforeExecute).toHaveBeenCalled();
                        expect(ajax.hooks.beforeExecute.mostRecentCall.args.length).toBe(1);
                        expect(ajax.hooks.beforeExecute.mostRecentCall.args[0]).toBe(options);
                        expect(data).toBeOfType('object');
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });

            it('should be able to cancel ajax with `beforeCreate` return true', function (done) {
                ajax.hooks.beforeCreate = function (options, request) {
                    request.resolve(1);
                    return true;
                };
                spyOn(ajax.hooks, 'beforeCreate').andCallThrough();
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading.then(function (data) {
                    try {
                        expect(ajax.hooks.beforeCreate).toHaveBeenCalled();
                        expect(ajax.hooks.beforeCreate.mostRecentCall.args.length).toBe(2);
                        expect(ajax.hooks.beforeCreate.mostRecentCall.args[0]).toBeOfType('object');
                        expect(ajax.hooks.beforeCreate.mostRecentCall.args[1]).toBeOfType('object');
                        expect(data).toBe(1);
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });

            it('should not stop ajax process if `beforeCreate` returns a non-true value', function (done) {
                ajax.hooks.beforeCreate = function (options, request) {
                    return 1;
                };
                spyOn(ajax.hooks, 'beforeCreate').andCallThrough();
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading.then(function (data) {
                    try {
                        expect(ajax.hooks.beforeCreate).toHaveBeenCalled();
                        expect(data).toBe('{ "x": 1 }');
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });

            it('should call `beforeSend` when process request', function (done) {
                ajax.hooks.beforeSend = jasmine.createSpy('beforeSend');
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading.then(function (data) {
                    try {
                        expect(ajax.hooks.beforeSend).toHaveBeenCalled();
                        expect(ajax.hooks.beforeSend.mostRecentCall.args.length).toBe(2);
                        expect(ajax.hooks.beforeSend.mostRecentCall.args[0]).toBeOfType('object');
                        expect(ajax.hooks.beforeSend.mostRecentCall.args[0].then).toBeOfType('function');
                        expect(ajax.hooks.beforeSend.mostRecentCall.args[1]).toBeOfType('object');
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });

            it('should call `afterReceive` when server responded', function (done) {
                ajax.hooks.afterReceive = jasmine.createSpy('afterReceive');
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading.then(function (data) {
                    try {
                        expect(ajax.hooks.afterReceive).toHaveBeenCalled();
                        expect(ajax.hooks.afterReceive.mostRecentCall.args.length).toBe(2);
                        expect(ajax.hooks.afterReceive.mostRecentCall.args[0]).toBeOfType('object');
                        expect(ajax.hooks.afterReceive.mostRecentCall.args[0].then).toBeOfType('function');
                        expect(ajax.hooks.afterReceive.mostRecentCall.args[0].responseText).toBe('{ "x": 1 }');
                        expect(ajax.hooks.afterReceive.mostRecentCall.args[1]).toBeOfType('object');
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });

            it('should be able to change the returned value with `afterParse`', function (done) {
                ajax.hooks.afterParse = function () {
                    return 1;
                };
                spyOn(ajax.hooks, 'afterParse').andCallThrough();;
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET',
                    dataType: 'json'
                };
                var loading = ajax.request(options);
                loading.then(function (data) {
                    try {
                        expect(data).toBe(1);
                        expect(ajax.hooks.afterParse).toHaveBeenCalled();
                        expect(ajax.hooks.afterParse.mostRecentCall.args.length).toBe(3);
                        expect(ajax.hooks.afterParse.mostRecentCall.args[0]).toEqual({ x: 1 });
                        expect(ajax.hooks.afterParse.mostRecentCall.args[1]).toBeOfType('object');
                        expect(ajax.hooks.afterParse.mostRecentCall.args[1].then).toBeOfType('function');
                        expect(ajax.hooks.afterParse.mostRecentCall.args[1].responseText).toBe('{ "x": 1 }');
                        expect(ajax.hooks.afterParse.mostRecentCall.args[2]).toBeOfType('object');
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });

            it('should fource the request fail by throw in `afterParse`', function (done) {
                ajax.hooks.afterParse = function () {
                    throw 'test';
                };
                spyOn(ajax.hooks, 'afterParse').andCallThrough();;
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET',
                    dataType: 'json'
                };
                var loading = ajax.request(options);
                loading.fail(function (data) {
                    try {
                        expect(data).toBeOfType('object');
                        expect(data.error).toBe('test');
                        expect(ajax.hooks.afterParse).toHaveBeenCalled();
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
            });
        });
    });
});