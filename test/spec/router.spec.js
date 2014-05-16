define(function (require) {
    var Router = require('er/router').Router;
    var router;
    var locator;
    var eventBus;

    beforeEach(function () {
        router = new Router();
        locator = {
            redirect: function (url) {
                this.fire('redirect', { url: url });
            }
        };
        require('mini-event/EventTarget').enable(locator);
        eventBus = {
            notifyError: jasmine.createSpy('notifyError')
        };
        require('mini-event/EventTarget').enable(eventBus);
        router.setLocator(locator);
        router.setEventBus(eventBus);
        router.start();
    });

    describe('router', function () {
        it('should exports an Router class', function () {
            expect(Router).toBeOfType('function');
        });

        it('should live as a global instance of Router class', function () {
            var globalInstance = require('er/router');
            expect(globalInstance).toBeDefined();
            expect(globalInstance instanceof Router).toBe(true);
        });

        it('should be instantiable', function () {
            expect(Router).not.toThrow();
        });

        it('should have a start method', function () {
            var router = new Router();
            expect(router.start).toBeOfType('function');
        });

        it('should be able to add string rule', function () {
            var addRule = function () {
                router.add('foo', function () {});
            };
            expect(addRule).not.toThrow();
        });

        it('should be able to add RegExp rule', function () {
            var addRule = function () {
                router.add(/^foo/, function () {});
            };
            expect(addRule).not.toThrow();
        });

        describe('accept string as rule', function () {
            it('should execute handler when path exactly matches', function () {
                var handler = jasmine.createSpy('stringPath');
                router.add('foo', handler);

                locator.redirect('foo');

                expect(handler).toHaveBeenCalled();
            });

            it('should not execute handler when path is not the same as url', function () {
                var handler = jasmine.createSpy('stringPath');
                router.add('foo', handler);

                locator.redirect('bar');

                expect(handler).not.toHaveBeenCalled();
            });

            it('should only compare the path part of a url', function () {
                var handler = jasmine.createSpy('stringPath');
                router.add('foo', handler);

                locator.redirect('foo~alice=bob');

                expect(handler).toHaveBeenCalled();
            });
        });

        describe('accept RegExp as rule', function () {
            it('should execute attached handler when RegExp test passes', function () {
                var handler = jasmine.createSpy('regExpPath');
                router.add(/^foo/, handler);

                locator.redirect('fooBar');

                expect(handler).toHaveBeenCalled();
            });

            it('should not execute handler when RegExp test fails', function () {
                var handler = jasmine.createSpy('regExpPath');
                router.add(/^foo/, handler);

                locator.redirect('bar');

                expect(handler).not.toHaveBeenCalled();
            });

            it('should only compare the path part of a url', function () {
                var handler = jasmine.createSpy('regExpPath');
                router.add(/^foo/, handler);

                locator.redirect('fooBar~alice=bob');

                expect(handler).toHaveBeenCalled();
            })
        });

        describe('accept a backup handler', function () {
            it('should execute for any pass-through urls', function () {
                var handler = jasmine.createSpy('backup');
                router.setBackup(handler);

                locator.redirect('foo');

                expect(handler).toHaveBeenCalled();
            });

            it('should not execute when a url is processed by a rule', function () {
                var handler = jasmine.createSpy('backup');
                router.setBackup(handler);
                router.add('foo', function () {});

                locator.redirect('foo');

                expect(handler).not.toHaveBeenCalled();
            });
        });

        describe('when execute handler', function () {
            it('should pass url as argument, and the router instance as this', function () {
                var handler = jasmine.createSpy('stringPath');
                router.add('foo', handler);

                locator.redirect('foo');

                expect(handler.calls.mostRecent().args[0].toString()).toBe('foo');
                expect(handler.calls.mostRecent().object).toBe(router);
            });

            it('should pass same arguments for backup handler', function () {
                var handler = jasmine.createSpy('backup');
                router.setBackup(handler);

                locator.redirect('foo');

                expect(handler.calls.mostRecent().args[0].toString()).toBe('foo');
                expect(handler.calls.mostRecent().object).toBe(router);
            });

            it('should fire route event on eventBus', function () {
                router.setBackup(function () {});
                var handler = jasmine.createSpy('routeEvent');
                eventBus.on('route', handler);

                locator.redirect('foo');

                expect(handler).toHaveBeenCalled();
                expect(handler.calls.mostRecent().args[0].url.toString()).toBe('foo');
                expect(handler.calls.mostRecent().args[0].router).toBe(router);
            });
        });
    });
});
