define(function (require) {
    var Controller = require('er/controller').Controller;

    var Empty = require('action/Empty');


    describe('controller', function () {
        var controller;
        var router;
        var locator;
        var eventBus;
        var permission;

        var testMainAction;

        beforeEach(function () {
            controller = new Controller();

            var container = document.createElement('div');
            container.id = 'controller-main-container';
            document.body.appendChild(container);
            controller.setMainContainer(container.id);

            router = {
                setBackup: jasmine.createSpy('setBackup')
            };
            controller.setRouter(router);

            locator = {
                redirect: jasmine.createSpy('locator')
            };
            controller.setLocator(locator);

            eventBus = {
                notifyError: jasmine.createSpy('notifyError'),
                fire: jasmine.createSpy('fire')
            };
            controller.setEventBus(eventBus);

            permission = {
                isAllow: function (auth) {
                    return auth === 'foo' || auth === 'bar';
                }
            };
            spyOn(permission, 'isAllow').and.callThrough();
            controller.setPermissionProvider(permission);

            controller.start();

            testMainAction = function (path, testcase, expect, done) {
                controller.renderAction(path)
                    .then(
                        function () {
                            try {
                                expect();
                                done();
                            }
                            catch (ex) {
                                expect(ex ? (ex.message || ex) : testcase).toFail();
                            }
                        },
                        function () {
                            expect(testcase).toFail();
                        }
                    );
            };
        });

        afterEach(function () {
            Empty.mostRecentInstance = null;
            var container = document.getElementById('controller-main-container');
            container.parentNode.removeChild(container);
        });

        it('should exports an Controller class', function () {
            expect(Controller).toBeOfType('function');
        });

        it('should live as a global instance of Controller class', function () {
            var globalInstance = require('er/controller');
            expect(globalInstance).toBeDefined();
            expect(globalInstance instanceof Controller).toBe(true);
        });

        it('should be instantiable', function () {
            expect(Controller).not.toThrow();
        });

        it('should process all router requests by default', function () {
            expect(router.setBackup).toHaveBeenCalled();
        });

        describe('when render an action', function () {
            describe('for the type property in action config', function () {
                it('should load a remote module if type is set to a module id', function (done) {
                    controller.registerAction({ path: 'foo', type: 'action/Empty' });
                    testMainAction(
                        'foo',
                        'test remote module',
                        function () {
                            expect(Empty.mostRecentInstance).toBeTruthy();
                            expect(Empty.mostRecentInstance.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should call a constructor if type is set to a function', function (done) {
                    controller.registerAction({ path: 'foo', type: Empty });
                    testMainAction(
                        'foo',
                        'test action constructor',
                        function () {
                            expect(Empty.mostRecentInstance).toBeTruthy();
                            expect(Empty.mostRecentInstance.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should call enter method if type is set to a plain object', function (done) {
                    var action = {
                        enter: jasmine.createSpy('enter')
                    };
                    controller.registerAction({ path: 'foo', type: action });
                    testMainAction(
                        'foo',
                        'test plain object',
                        function () {
                            expect(action.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should call createRuntimeAction method if type is set to an action factory', function (done) {
                    var instance;
                    var factory = {
                        createRuntimeAction: function () {
                            instance = {
                                enter: jasmine.createSpy('enter')
                            };
                            return instance;
                        }
                    };
                    controller.registerAction({ path: 'foo', type: factory });
                    testMainAction(
                        'foo',
                        'test action factory',
                        function () {
                            expect(instance).toBeDefined();
                            expect(instance.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should accept createRuntimeAction to return a Promise', function (done) {
                    var instance;
                    var factory = {
                        createRuntimeAction: function () {
                            var Deferred = require('er/Deferred');
                            instance = {
                                enter: jasmine.createSpy('enter')
                            };
                            return Deferred.resolved(instance);
                        }
                    };
                    controller.registerAction({ path: 'foo', type: factory });
                    testMainAction(
                        'foo',
                        'test deferred action factory',
                        function () {
                            expect(instance).toBeDefined();
                            expect(instance.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });
            });

            describe('for complex action config', function () {
                var action;
                beforeEach(function () {
                    action = {
                        enter: jasmine.createSpy('enter')
                    };
                });

                it('should process movedTo property and redirect to the target action', function (done) {
                    controller.registerAction({ path: 'foo', movedTo: 'bar' });
                    controller.registerAction({ path: 'bar', type: action });
                    testMainAction(
                        'foo',
                        'test movedTo config',
                        function () {
                            expect(action.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should check authority when it is a single string', function (done) {
                    controller.registerAction({ path: 'foo', authority: 'foo', type: action });
                    testMainAction(
                        'foo',
                        'test single auth string',
                        function () {
                            expect(action.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should pass authority check when it is an array and at least one of them is allowed', function (done) {
                    controller.registerAction({ path: 'foo', authority: ['foo', 'alice'], type: action });
                    testMainAction(
                        'foo',
                        'test auth array',
                        function () {
                            expect(action.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should pass authority check when it is a combined string and at least one of them is allowed', function (done) {
                    controller.registerAction({ path: 'foo', authority: 'foo | alice', type: action });
                    testMainAction(
                        'foo',
                        'test combined auth string',
                        function () {
                            expect(action.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should accept authority as a function', function (done) {
                    controller.registerAction({ path: 'foo', authority: function () { return true; }, type: action });
                    testMainAction(
                        'foo',
                        'test auth function',
                        function () {
                            expect(action.enter).toHaveBeenCalled();
                        },
                        done
                    );
                })

                it('should redirect to noAuthorityLocation if not allowed', function (done) {
                    controller.registerAction({ path: 'foo', authority: 'alice', noAuthorityLocation: 'bar' });
                    controller.registerAction({ path: 'bar', type: action });
                    testMainAction(
                        'foo',
                        'test noAuthorityLocation',
                        function () {
                            expect(action.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });

                it('should redirect to global noAuthorityLocation if not allowed', function (done) {
                    controller.setNoAuthorityLocation('bar');
                    controller.registerAction({ path: 'foo', authority: 'alice' });
                    controller.registerAction({ path: 'bar', type: action });
                    testMainAction(
                        'foo',
                        'test globa noAuthorityLocation',
                        function () {
                            expect(action.enter).toHaveBeenCalled();
                        },
                        done
                    );
                });
            });

            describe('the provided action context', function () {
                var action;

                beforeEach(function () {
                    action = {
                        enter: jasmine.createSpy('enter')
                    };
                });

                it('should contain a url property', function (done) {
                    controller.registerAction({ path: 'foo', type: action });
                    testMainAction(
                        'foo',
                        'test url property',
                        function () {
                            var context = action.enter.calls.mostRecent().args[0];
                            expect(context.url.toString()).toBe('foo');
                        },
                        done
                    );
                });

                it('should contain a title property from action config\'s title proprety', function (done) {
                    controller.registerAction({ path: 'foo', title: 'bar', type: action });
                    testMainAction(
                        'foo',
                        'test title property',
                        function () {
                            var context = action.enter.calls.mostRecent().args[0];
                            expect(context.title).toBe('bar');
                        },
                        done
                    );
                });

                it('should contain a referrer property if possible', function (done) {
                    controller.registerAction({ path: 'foo',  type: action });
                    controller.registerAction({ path: 'bar', type: { enter: function () {} } });
                    controller.renderAction('bar')
                        .then(
                            function () {
                                testMainAction(
                                    'foo',
                                    'test referrer',
                                    function () {
                                        var context = action.enter.calls.mostRecent().args[0];
                                        expect(context.referrer.toString()).toBe('bar');
                                    },
                                    done
                                );
                            },
                            function () {
                                expect('test referrer').toFail();
                            }
                        );
                });

                it('should mark referrer as null if not exist', function (done) {
                    controller.registerAction({ path: 'foo',  type: action });
                    testMainAction(
                        'foo',
                        'test null referrer',
                        function () {
                            var context = action.enter.calls.mostRecent().args[0];
                            expect(context.referrer).toBeNull();
                        },
                        done
                    );
                });

                it('should contain all properties from action config\'s args property', function (done) {
                    controller.registerAction({ path: 'foo', type: action, args: { x: 1, y: 2 } });
                    testMainAction(
                        'foo',
                        'test url queries',
                        function () {
                            var context = action.enter.calls.mostRecent().args[0];
                            expect(context.x).toBe(1);
                            expect(context.y).toBe(2);
                        },
                        done
                    );
                });

                describe('has a args property', function () {
                    it('should contain marely all properties in its parent action context object', function (done) {
                        controller.registerAction({ path: 'foo', title: 'bar', type: action, args: { x: 1, y: 2 } });
                        controller.registerAction({ path: 'bar', type: { enter: function () {} } });
                        controller.renderAction('bar').then(
                            function () {
                                testMainAction(
                                    'foo',
                                    'test args property for action context',
                                    function () {
                                        var context = action.enter.calls.mostRecent().args[0];
                                        var args = context.args;
                                        expect(args.url.toString()).toBe('foo');
                                        expect(args.title).toBe('bar');
                                        expect(args.referrer.toString()).toBe('bar');
                                        expect(args.x).toBe(1);
                                        expect(args.y).toBe(2);
                                    },
                                    done
                                );
                            },
                            function () {
                                expect('test args property for action context').toFail();
                            }
                        );
                    });

                    it('should contain all url queries', function (done) {
                        controller.registerAction({ path: 'foo', type: action });
                        testMainAction(
                            'foo~x=1&y=2',
                            'test url queries',
                            function () {
                                var args = action.enter.calls.mostRecent().args[0].args;
                                expect(args.x).toBe('1');
                                expect(args.y).toBe('2');
                            },
                            done
                        );
                    });

                    it('should override a property in action config\'s args property if it is also in url query', function (done) {
                        controller.registerAction({ path: 'foo', type: action, args: { x: 1 } });
                        testMainAction(
                            'foo~x=2',
                            'test url query override',
                            function () {
                                var args = action.enter.calls.mostRecent().args[0].args;
                                expect(args.x).toBe('2');
                            },
                            done
                        );
                    });
                });
            });
        });

        describe('when render a child action', function () {
            var testChildAction;
            var action;

            beforeEach(function () {
                action = {
                    enter: jasmine.createSpy('enter')
                };
                var container = document.createElement('div');
                container.id = 'child-action-container';
                document.body.appendChild(container);

                testChildAction = function (path, options, testcase, expect, done) {
                    controller.renderChildAction(path, 'child-action-container', options)
                        .then(
                            function () {
                                try {
                                    expect();
                                    done();
                                }
                                catch (ex) {
                                    expect(ex ? (ex.message || ex) : testcase).toFail();
                                }
                            },
                            function () {
                                expect(testcase).toFail();
                            }
                        );
                };
            });

            afterEach(function () {
                var container = document.getElementById('child-action-container');
                container.parentNode.removeChild(container);
            });

            it('should resolve the correct referrer', function (done) {
                controller.registerAction({ path: 'foo', type: action });
                controller.registerAction({ path: 'bar', type: { enter: function () {} } });
                controller.renderChildAction('bar', 'child-action-container').then(
                    function () {
                        testChildAction(
                            'foo',
                            null,
                            'test child action referrer',
                            function () {

                            },
                            done
                        );
                    },
                    function () {
                        expect('test child action referrer').toFail();
                    }
                );
            });
        });
    });
});


// events
//   - enteraction
//   - enteractioncomplete
//   - enteractionfail
//   - actionabort
//   - actionloaded
//   - forwardaction


// childAction
//   - redirect
