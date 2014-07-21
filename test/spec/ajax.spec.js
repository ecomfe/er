define(function (require) {
    var Ajax = require('er/ajax').Ajax;

    describe('ajax', function () {
        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(function () {
            jasmine.Ajax.uninstall();
        });

        it('should exports an Ajax class', function () {
            expect(Ajax).toBeOfType('function');
        });

        it('should live as a global instance of Ajax class', function () {
            var globalInstance = require('er/ajax');
            expect(globalInstance).toBeDefined();
            expect(globalInstance instanceof Ajax).toBe(true);
        });

        it('should be instantiable', function () {
            expect(Ajax).not.toThrow();
        });

        describe('request method', function () {
            var ajax = new Ajax();


            it('should exist', function () {
                expect(ajax.request).toBeOfType('function');
            });

            it('should return a Promise', function () {
                var xhr = ajax.request({ url: 'foo' });
                expect(xhr.then).toBeOfType('function');
                jasmine.Ajax.requests.mostRecent().response({ status: 200 });
            });

            it('should request the remote url with proper HTTP method', function () {
                var get = ajax.request({ url: 'foo', method: 'GET', cache: true });
                expect(jasmine.Ajax.requests.mostRecent().url).toBe('foo');
                expect(jasmine.Ajax.requests.mostRecent().method).toBe('GET');
                jasmine.Ajax.requests.mostRecent().response({ status: 200 });

                var get = ajax.request({ url: 'foo', method: 'POST', cache: true });
                expect(jasmine.Ajax.requests.mostRecent().url).toBe('foo');
                expect(jasmine.Ajax.requests.mostRecent().method).toBe('POST');
                jasmine.Ajax.requests.mostRecent().response({ status: 200 });
            });

            it('should resolve the Promise when remote success', function (done) {
                var loading = ajax.request({ url: 'foo' });

                jasmine.Ajax.requests.mostRecent().response({ status: 200, responseText: 'bar' });

                loading
                    .then(
                        function (data) {
                            expect(data).toBe('bar');
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);
            });

            it('should reject the Promise when remote fail', function (done) {
                var loading = ajax.request({ url: 'foo' });

                jasmine.Ajax.requests.mostRecent().response({ status: 500, responseText: 'bar' });

                loading
                    .fail(function (xhr) {
                        expect(xhr.responseText).toBe('bar');
                        expect(xhr.status).toBe(500);
                    })
                    .ensure(done);
            });

            it('should reject the Promise when timeout', function (done) {
                var loading = ajax.request({ url: 'foo', timeout: 8 });

                loading
                    .fail(function (xhr) {
                        expect(xhr.status).toBe(408);
                    })
                    .ensure(done);
            });

            it('should parse a json string when dataType is set to "json"', function (done) {
                var loading = ajax.request({ url: 'foo', dataType: 'json' });

                jasmine.Ajax.requests.mostRecent().response({ status: 200, responseText: '{ "bar": 1 }' });

                loading
                    .then(
                        function (data) {
                            expect(data).toEqual({ bar: 1 });
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);
            });

            it('should fire done event when request success', function (done) {
                var handler = jasmine.createSpy('done');
                ajax.on('done', handler);
                var loading = ajax.request({ url: 'foo' });

                jasmine.Ajax.requests.mostRecent().response({ status: 200 });

                loading
                    .then(
                        function () {
                            expect(handler).toHaveBeenCalled();
                            var event = handler.calls.mostRecent().args[0];
                            expect(event).toBeOfType('object');
                            expect(event.xhr).toBe(loading);
                            expect(event.options.url).toBe('foo');
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);
            });

            it('should fire fail event when request fail', function (done) {
                var handler = jasmine.createSpy('fail');
                ajax.on('fail', handler);
                var loading = ajax.request({ url: 'foo' });

                jasmine.Ajax.requests.mostRecent().response({ status: 500 });

                loading
                    .then(
                        function () {
                            expect(handler).toHaveBeenCalled();
                            var event = handler.calls.mostRecent().args[0];
                            expect(event).toBeOfType('object');
                            expect(event.xhr).toBe(loading);
                            expect(event.options.url).toBe('foo');
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);
            });

            it('should fire timeout event when request timeout', function (done) {
                var handler = jasmine.createSpy('timeout');
                ajax.on('timeout', handler);
                var loading = ajax.request({ url: 'foo', timeout: 1 });

                loading
                    .fail(
                        function () {
                            expect(handler).toHaveBeenCalled();
                            var event = handler.calls.mostRecent().args[0];
                            expect(event).toBeOfType('object');
                            expect(event.xhr).toBe(loading);
                            expect(event.options.url).toBe('foo');
                        }
                    )
                    .ensure(done);
            });
        });

        describe('hooks', function () {
            var ajax;

            beforeEach(function () {
                ajax = new Ajax();
            });

            it('should be an object', function () {
                expect(ajax.hooks).toBeOfType('object');
            });

            it('should not share between instances', function () {
                var another = new Ajax();
                expect(ajax.hooks).not.toBe(another.hooks);
            });

            it('should be able to add options with beforeExecute', function (done) {
                ajax.hooks.beforeExecute = function (options) {
                    options.dataType = 'json';
                };
                spyOn(ajax.hooks, 'beforeExecute').and.callThrough();
                var options = {
                    url: './asset/res/x.json',
                    method: 'GET'
                };
                var loading = ajax.request(options);

                loading
                    .then(
                        function () {
                            expect(ajax.hooks.beforeExecute).toHaveBeenCalled();
                            expect(ajax.hooks.beforeExecute.calls.mostRecent().args.length).toBe(1);
                            expect(ajax.hooks.beforeExecute.calls.mostRecent().args[0]).toBe(options);
                            expect(data).toBeOfType('object');
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);

                jasmine.Ajax.requests.mostRecent().response({ status: 200 });
            });

            it('should cancel request when beforeCreate returns true', function (done) {
                ajax.hooks.beforeCreate = function (options, request) {
                    request.resolve(1);
                    return true;
                };
                spyOn(ajax.hooks, 'beforeCreate').and.callThrough();

                var options = {
                    url: './asset/res/x.json',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading
                    .then(
                        function (data) {
                            expect(ajax.hooks.beforeCreate).toHaveBeenCalled();
                            expect(ajax.hooks.beforeCreate.calls.mostRecent().args.length).toBe(2);
                            expect(ajax.hooks.beforeCreate.calls.mostRecent().args[0]).toBeOfType('object');
                            expect(ajax.hooks.beforeCreate.calls.mostRecent().args[1]).toBeOfType('object');
                            expect(data).toBe(1);

                            // 确认没有发起真正的请求
                            expect(jasmine.Ajax.requests.count()).toBe(0);
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);
            });

            it('should not stop ajax process if beforeCreate returns a non-true value', function (done) {
                ajax.hooks.beforeCreate = function (options, request) {
                    return 1;
                };
                spyOn(ajax.hooks, 'beforeCreate').and.callThrough();
                var options = {
                    url: 'foo',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading
                    .then(
                        function (data) {
                            expect(ajax.hooks.beforeCreate).toHaveBeenCalled();
                            expect(data).toBe('bar');

                            expect(jasmine.Ajax.requests.count()).toBe(1);
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);

                jasmine.Ajax.requests.mostRecent().response({ status: 200, responseText: 'bar' });
            });

            it('should call beforeSend when process request', function () {
                ajax.hooks.beforeSend = jasmine.createSpy('beforeSend');
                var options = {
                    url: 'foo',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                expect(ajax.hooks.beforeSend).toHaveBeenCalled();
                expect(ajax.hooks.beforeSend.calls.mostRecent().args.length).toBe(2);
                expect(ajax.hooks.beforeSend.calls.mostRecent().args[0]).toBeOfType('object');
                expect(ajax.hooks.beforeSend.calls.mostRecent().args[0].then).toBeOfType('function');
                expect(ajax.hooks.beforeSend.calls.mostRecent().args[1]).toBeOfType('object');

                jasmine.Ajax.requests.mostRecent().response({ status: 200 });
            });

            it('should call afterReceive when remote returns', function (done) {
                ajax.hooks.afterReceive = jasmine.createSpy('afterReceive');
                var options = {
                    url: 'foo',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading
                    .then(
                        function (data) {
                            expect(ajax.hooks.afterReceive).toHaveBeenCalled();
                            expect(ajax.hooks.afterReceive.calls.mostRecent().args.length).toBe(2);
                            expect(ajax.hooks.afterReceive.calls.mostRecent().args[0]).toBeOfType('object');
                            expect(ajax.hooks.afterReceive.calls.mostRecent().args[0].then).toBeOfType('function');
                            expect(ajax.hooks.afterReceive.calls.mostRecent().args[0].responseText).toBe('bar');
                            expect(ajax.hooks.afterReceive.calls.mostRecent().args[1]).toBeOfType('object');
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);

                jasmine.Ajax.requests.mostRecent().response({ status: 200, responseText: 'bar' });
            });

            it('should be able to change the returned value with afterParse', function (done) {
                ajax.hooks.afterParse = function () {
                    return 1;
                };
                spyOn(ajax.hooks, 'afterParse').and.callThrough();;
                var options = {
                    url: 'foo',
                    method: 'GET',
                    dataType: 'json'
                };
                var loading = ajax.request(options);
                loading
                    .then(
                        function (data) {
                            expect(data).toBe(1);
                            expect(ajax.hooks.afterParse).toHaveBeenCalled();
                            expect(ajax.hooks.afterParse.calls.mostRecent().args.length).toBe(3);
                            expect(ajax.hooks.afterParse.calls.mostRecent().args[0]).toEqual({ x: 1 });
                            expect(ajax.hooks.afterParse.calls.mostRecent().args[1]).toBeOfType('object');
                            expect(ajax.hooks.afterParse.calls.mostRecent().args[1].then).toBeOfType('function');
                            expect(ajax.hooks.afterParse.calls.mostRecent().args[1].responseText).toBe('bar');
                            expect(ajax.hooks.afterParse.calls.mostRecent().args[2]).toBeOfType('object');
                        },
                        function (xhr) {
                            throw new Error(xhr.status);
                        }
                    )
                    .ensure(done);

                jasmine.Ajax.requests.mostRecent().response({ status: 200, responseText: 'bar' });
            });

            it('should fource the request fail by throw in afterParse', function (done) {
                ajax.hooks.afterParse = function () {
                    throw 'test';
                };
                spyOn(ajax.hooks, 'afterParse').and.callThrough();;
                var options = {
                    url: 'foo',
                    method: 'GET'
                };
                var loading = ajax.request(options);
                loading.
                    fail(function (data) {
                        expect(data).toBeOfType('object');
                        expect(data.error).toBe('test');
                        expect(ajax.hooks.afterParse).toHaveBeenCalled();
                    })
                    .ensure(done);

                jasmine.Ajax.requests.mostRecent().response({ status: 200, responseText: 'bar' });
            });
        });

        describe('serializeData hook', function () {
            var ajax;

            beforeEach(function () {
                ajax = new Ajax();
            });

            it('should be implemented by default', function () {
                expect(ajax.hooks.serializeData).toBeOfType('function');
            });

            it('should be called for a non-get request', function () {
                spyOn(ajax.hooks, 'serializeData');
                var data = { x: 1 };
                var options = {
                    url: 'foo',
                    method: 'POST',
                    contentType: 'application/json',
                    data: data
                };
                var loading = ajax.request(options);

                expect(ajax.hooks.serializeData).toHaveBeenCalled();
                expect(ajax.hooks.serializeData.calls.mostRecent().args.length).toBe(4);
                expect(ajax.hooks.serializeData.calls.mostRecent().args[0]).toBe('');
                expect(ajax.hooks.serializeData.calls.mostRecent().args[1]).toBe(data);
                expect(ajax.hooks.serializeData.calls.mostRecent().args[2]).toBe('application/json');
                expect(ajax.hooks.serializeData.calls.mostRecent().args[3]).toBe(loading);

                jasmine.Ajax.requests.mostRecent().response({ status: 200 });
            });

            it('should give a default value of contentType parameter', function () {
                ajax.hooks.serializeData = jasmine.createSpy('serializeData');
                var options = {
                    url: 'foo',
                    method: 'POST'
                };
                var loading = ajax.request(options);
                expect(ajax.hooks.serializeData).toHaveBeenCalled();
                expect(ajax.hooks.serializeData.calls.mostRecent().args[2]).toBe('application/x-www-form-urlencoded');

                jasmine.Ajax.requests.mostRecent().response({ status: 200 });
            });

            it('should correctly serialize a number', function () {
                expect(ajax.hooks.serializeData(1)).toBe('1');
                expect(ajax.hooks.serializeData(1.2)).toBe('1.2');
            });

            it('should correctly serialize a boolean', function () {
                expect(ajax.hooks.serializeData(true)).toBe('true');
                expect(ajax.hooks.serializeData(false)).toBe('false');
            });

            it('should correctly serialize a string and encode it', function () {
                expect(ajax.hooks.serializeData('abc')).toBe('abc');
                expect(ajax.hooks.serializeData('&=_1%234')).toBe(encodeURIComponent('&=_1%234'));
            });

            it('should correctly serialize an array', function () {
                expect(ajax.hooks.serializeData([1, 2, 3])).toBe('1,2,3');
                expect(ajax.hooks.serializeData(['a', '&', '='])).toBe('a,%26,%3D');
            });

            it('should correctly serialize an object', function () {
                var o = {
                    x: 1,
                    y: 'test',
                    z: ['a', '&', 'c']
                };
                expect(ajax.hooks.serializeData(o)).toBe('x=1&y=test&z=a,%26,c');
            });

            it('should correctly serialize a deep object', function () {
                var o = {
                    x: 1,
                    y: {
                        a: 1,
                        b: 'test',
                        c: ['a', '&', 'c']
                    },
                    z: false
                };
                expect(ajax.hooks.serializeData(o)).toBe('x=1&y.a=1&y.b=test&y.c=a,%26,c&z=false');
            });

            it('should serialize null and undefined to an empty string', function () {
                expect(ajax.hooks.serializeData(null)).toBe('');
                expect(ajax.hooks.serializeData(undefined)).toBe('');
                expect(ajax.hooks.serializeData({ x: null })).toBe('x=');
            })
        });
    });
});
