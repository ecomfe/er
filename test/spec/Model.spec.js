define(function (require) {
    var Model = require('er/Model');
    var Deferred = require('er/Deferred');

    function Plain() {
    }
    Plain.prototype.y = 1;

    describe('Model', function () {
        it('should be a constructor', function () {
            expect(Model).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Model()).toBeOfType('object');
        });

        it('should have a `get` function', function () {
            var model = new Model();
            expect(model.get).toBeOfType('function');
        });

        it('should have a `set` function', function () {
            var model = new Model();
            expect(model.set).toBeOfType('function');
        });

        it('should have a `fill` function', function () {
            var model = new Model();
            expect(model.fill).toBeOfType('function');
        });

        it('should have a `remove` function', function () {
            var model = new Model();
            expect(model.remove).toBeOfType('function');
        });

        it('should have a `getAsModel` function', function () {
            var model = new Model();
            expect(model.getAsModel).toBeOfType('function');
        });

        it('should have a `valueOf` function', function () {
            var model = new Model();
            expect(model.valueOf).toBeOfType('function');
        });

        it('should have a `clone` function', function () {
            var model = new Model();
            expect(model.clone).toBeOfType('function');
        });

        describe('constructor', function () {
            it('should accept an object as argument', function () {
                var context = {};
                expect(new Model(context)).toBeOfType('object');
            });

            it('should extend context\'s properties', function () {
                var context = { x: 1 };
                var model = new Model(context);
                expect(model.get('x')).toBe(1);
            });

            it('should not extend [[Prototype]]\'s properties', function () {
                var context = new Plain();
                var model = new Model(context);
                expect(model.get('y')).toBeUndefined();
            });

            it('should not use the context directly', function () {
                var context = {};
                var model = new Model(context);
                context.x = 1;
                expect(model.get('x')).toBeUndefined();
            });
        });

        describe('`set` method', function () {
            it('should be able to add a property', function () {
                var model = new Model();
                var value = {};
                model.set('x', value);
                expect(model.get('x')).toBe(value);
            });

            it('should change the value if a property exists', function () {
                var model = new Model({ x: 1 });
                var value = {};
                model.set('x', value);
                expect(model.get('x')).toBe(value);
            });

            it('should return the given value', function () {
                var model = new Model();
                var value = {};
                var returnValue = model.set('x', value);
                expect(returnValue).toBe(value);
            });
        });

        describe('`fill` method', function () {
            it('should be able to add properties', function () {
                var model = new Model();
                model.fill({ x: 1, y: 1 });
                expect(model.get('x')).toBe(1);
                expect(model.get('y')).toBe(1);
            });

            it('should be able to update properties', function () {
                var model = new Model({ x: 1, y: 1 });
                model.fill({ x: 2, y: 2 });
                expect(model.get('x')).toBe(2);
                expect(model.get('y')).toBe(2);
            });

            it('should return the given extension object', function () {
                var model = new Model();
                var value = { foo: 1, bar: 2 };
                var returnValue = model.set('x', value);
                expect(returnValue).toBe(value);
            });
        });

        describe('`remove` method', function () {
            it('should be able to remove a existing property', function () {
                var model = new Model({ x: 1 });
                model.remove('x');
                expect(model.get('x')).toBeUndefined();
            });

            it('should do noting when removing an non-exist property', function () {
                var model = new Model();
                model.remove('x');
                expect(model.get('x')).toBeUndefined();
            });
        });

        describe('`valueOf` method', function () {
            it('should return a plain object', function () {
                var model = new Model({ x: 1 });
                var value = model.valueOf();
                expect(value).toBeOfType('object');
            });

            it('should fill the return value with its properties', function () {
                var model = new Model({ x: 1 });
                var value = model.valueOf();
                expect(value.x).toBe(1);
            });

            it('should not return its stored context directly', function () {
                var model = new Model({ x: 1 });
                var value = model.valueOf();
                model.set('y', 1);
                expect(value.y).toBeUndefined();
            });
        });

        describe('`clone` method', function () {
            it('should return a Model object', function () {
                var model = new Model();
                var clone = model.clone();
                expect(clone instanceof Model).toBe(true);
            });

            it('should not return itself', function () {
                var model = new Model();
                var clone = model.clone();
                expect(clone).not.toBe(model);
            });

            it('should clone its properties to the new model', function () {
                var model = new Model({ x: 1 });
                var clone = model.clone();
                expect(clone.get('x')).toBe(1);
            });
        });

        describe('`getAsModel` method', function () {
            var model = new Model({
                x: {
                    y: 1,
                }
            });
            var child = model.getAsModel('x');

            it('should return a Model object', function () {
                expect(child instanceof Model).toBe(true);
            });

            it('should fill child properties to the new model', function () {
                expect(child.get('y')).toBe(1);
            });
        });

        describe('`change` event', function () {
            it('should fire a `change` event when calling `set` method to add or update a property', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.set('x', 1);
                expect(handler).toHaveBeenCalled();
            });

            it('should fire a `change` event when calling `fill` method to add or updated properties', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.fill({ x: 1 });
                expect(handler).toHaveBeenCalled();
            });

            it('should fire a `change` event when calling `remove` method to remove a property', function () {
                var model = new Model({ x: 1 });
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.remove('x');
                expect(handler).toHaveBeenCalled();
            });

            it('should have a `type` property with value **change** in its event object', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.set('x', 1);
                expect(handler.calls.mostRecent().args[0].type).toBe('change');
            });

            it('should have a `changes` array in its event object', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.set('x', 1);
                expect(handler.calls.mostRecent().args[0].changes).toBeOfType('array');
            });

            it('should have a `type` property in its change record', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.set('x', 1);
                var record = handler.calls.mostRecent().args[0].changes[0];
                expect(record.type).toBeOfType('string');
            });

            it('should have a `oldValue` property in its change record', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.set('x', 1);
                var record = handler.calls.mostRecent().args[0].changes[0];
                expect(record.hasOwnProperty('oldValue')).toBe(true);
            });

            it('should have a `newValue` property in its change record', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.set('x', 1);
                var record = handler.calls.mostRecent().args[0].changes[0];
                expect(record.hasOwnProperty('newValue')).toBe(true);
            });

            it('should fire with type **add** when adding a property', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                var value = {};
                model.set('x', value);
                var record = handler.calls.mostRecent().args[0].changes[0];
                expect(record.type).toBe('add');
                expect(record.newValue).toBe(value);
                expect(record.oldValue).toBeUndefined();
            });

            it('should fire with type **change** when updating a property', function () {
                var model = new Model({ x: 1 });
                var handler = jasmine.createSpy();
                model.on('change', handler);
                var value = {};
                model.set('x', value);
                var record = handler.calls.mostRecent().args[0].changes[0];
                expect(record.type).toBe('change');
                expect(record.newValue).toBe(value);
                expect(record.oldValue).toBe(1);
            });

            it('should not fire when set a value with the same value as its previous value', function () {
                var model = new Model({ x: 1 });
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.set('x', 1);
                expect(handler).not.toHaveBeenCalled();
            });

            it('should give the same number of change records as added-or-updated properties when calling `fill` method', function () {
                var model = new Model({ x: 1 });
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.fill({ x: 1, y: 2, z: 3 });
                expect(handler.calls.mostRecent().args[0].changes.length).toBe(2);
            });

            it('should fire with type **remove** when removing a property', function () {
                var model = new Model({ x: 1 });
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.remove('x');
                var record = handler.calls.mostRecent().args[0].changes[0];
                expect(record.type).toBe('remove');
                expect(record.newValue).toBeUndefined();
                expect(record.oldValue).toBe(1);
            });

            it('should not fire when removing a non-exist property', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.remove('x');
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not fire if `silent = true` is given when calling `set` method', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.set('x', 1, { silent: true });
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not fire if `silent = true` is given when calling `fill` method', function () {
                var model = new Model();
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.fill({ x: 1 }, { silent: true });
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not fire if `silent = true` is given when calling `remove` method', function () {
                var model = new Model({ x: 1 });
                var handler = jasmine.createSpy();
                model.on('change', handler);
                model.remove('x', { silent: true });
                expect(handler).not.toHaveBeenCalled();
            });
        });

        describe('automatic load machanism', function () {
            function delayed(timeout, value, queue) {
                return function () {
                    var deferred = new Deferred();
                    setTimeout(function () {
                        if (queue) {
                            queue.push(value);
                        }
                        deferred.resolve(value);
                    }, timeout);
                    return deferred.promise;
                }
            }

            it('should have a `load` method', function () {
                expect((new Model()).load).toBeOfType('function');
            });

            it('should have a `prepare` method', function () {
                expect((new Model()).prepare).toBeOfType('function');
            });

            it('should return a Promise when calling `load` method', function () {
                var model = new Model();
                var value = model.load();
                expect(Deferred.isPromise(value)).toBe(true);
            });

            it('should resolve the Promise **after** `prepare` method is executed', function (done) {
                var model = new Model();
                spyOn(model, 'prepare');
                var promise = model.load();
                promise.done(function () {
                    expect(model.prepare).toHaveBeenCalled();
                    done();
                });
            });

            it('should add a property if `datasource` is given as an object', function (done) {
                var model = new Model();
                model.datasource = {
                    x: function() {
                        return 1;
                    }
                };
                var promise = model.load();
                promise.done(function () {
                    expect(model.get('x')).toBe(1);
                    done();
                });
            });

            it('should wait for datasource loaded if data factory returns a Promise', function (done) {
                var model = new Model();
                var deferred = new Deferred();
                model.datasource = {
                    x: function () {
                        setTimeout(function () {
                            deferred.resolve(1);
                        }, 0);
                        return deferred.promise;
                    }
                };
                var promise = model.load();
                promise.done(function () {
                    expect(deferred.state).toBe('resolved');
                    expect(model.get('x')).toBe(1);
                    done();
                });
            });

            it('should load data in parallel if `datasource` is given as an object', function (done) {
                var model = new Model();
                var queue = [];
                model.datasource = {
                    x: delayed(20, 'a', queue),
                    y: delayed(10, 'b', queue)
                };
                var promise = model.load();
                promise.done(function () {
                    expect(queue.join('')).toBe('ba');
                    done();
                });
            });

            it('should load data in parallel if `datasource` is given as an array', function (done) {
                var model = new Model();
                var queue = [];
                model.datasource = [
                    { x: delayed(20, 'a', queue) },
                    { y: delayed(10, 'b', queue) }
                ];
                var promise = model.load();
                promise.done(function () {
                    expect(queue.join('')).toBe('ab');
                    done();
                });
            });

            it('should give the correct load sequence when `datasource` is given as a mixed config', function (done) {
                var model = new Model();
                var queue = [];
                model.datasource = [
                    { x: delayed(20, 'a', queue) },
                    { y: delayed(10, 'b', queue) },
                    {
                        a: delayed(20, 'c', queue),
                        b: delayed(10, 'd', queue)
                    }
                ];
                var promise = model.load();
                promise.done(function () {
                    expect(queue.join('')).toBe('abdc');
                    done();
                });
            });

            it('should accept data load descriptor as `datasource` item', function (done) {
                var model = new Model();
                var queue = [];
                model.datasource = {
                    x: { name: 'a', retrieve: delayed(20, 'a', queue) },
                    y: { name: 'b', retrieve: delayed(10, 'b', queue) }
                };
                var promise = model.load();
                promise.done(function () {
                    expect(queue.join('')).toBe('ba');
                    expect(model.get('x')).toBeUndefined();
                    expect(model.get('y')).toBeUndefined();
                    expect(model.get('a')).toBe('a');
                    expect(model.get('b')).toBe('b');
                    done();
                });
            });

            it('should ignore `name` descriptor property if `dump` is set to true', function (done) {
                var model = new Model();
                model.datasource = [
                    {
                        name: 'x',
                        retrieve: function() {
                            return {
                                x: 1,
                                y: 2
                            }
                        },
                        dump: true
                    }
                ];
                var promise = model.load();
                promise.done(function () {
                    expect(model.get('x')).toBe(1);
                    expect(model.get('y')).toBe(2);
                    done();
                });
            })

            it('should dump the return value if `datasource` is given as a function', function (done) {
                var model = new Model();
                model.datasource = function () {
                    return {
                        x: 1,
                        y: 2
                    };
                }
                var promise = model.load();
                promise.done(function () {
                    expect(model.get('x')).toBe(1);
                    expect(model.get('y')).toBe(2);
                    done();
                });
            });

            describe('worker management mechanism', function () {
                it('should abort a abortable Promise if model is disposed before it resolves', function () {
                    var model = new Model();
                    var spy = jasmine.createSpy('abort');
                    model.datasource = function () {
                        var promise = delayed(1, 1)();
                        promise.abort = spy;
                        return promise;
                    };
                    model.load();
                    model.dispose();
                    expect(spy).toHaveBeenCalled();
                });

                it('should abort a abortable Promise in sequence config if model is disposed before it resolves', function (done) {
                    var model = new Model();
                    var spy = jasmine.createSpy('abort');
                    model.datasource = [
                        function () {
                            var promise = delayed(1, 10)();
                            promise.abort = spy;
                            return promise;
                        }
                    ];
                    model.load();
                    setTimeout(function () {
                        model.dispose();
                        expect(spy).toHaveBeenCalled();
                        done();
                    }, 1);
                });

                it('should abort a abortable Promise in parallel config if model is disposed before it resolves', function () {
                    var model = new Model();
                    var spy = jasmine.createSpy('abort');
                    model.datasource = {
                        a: function () {
                            var promise = delayed(1, 1)();
                            promise.abort = spy;
                            return promise;
                        }
                    };
                    model.load();
                    model.dispose();
                    expect(spy).toHaveBeenCalled();
                });

                it('should not call `abort` after it resolves', function (done) {
                    var model = new Model();
                    var spy = jasmine.createSpy('abort');
                    model.datasource = function () {
                        var promise = delayed(1, 1)();
                        promise.abort = spy;
                        return promise;
                    };
                    model.load().done(function () {
                        expect(spy).not.toHaveBeenCalled();
                        done();
                    });
                });
            });
        });
    });
});