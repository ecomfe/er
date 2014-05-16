define(function (require) {
    var EventBus = require('er/events').EventBus;

    describe('events', function () {
        it('should exports an EventBus class', function () {
            expect(EventBus).toBeOfType('function');
        });

        it('should live as a global instance of EventBus class', function () {
            var globalInstance = require('er/events');
            expect(globalInstance).toBeDefined();
            expect(globalInstance instanceof EventBus).toBe(true);
        });

        it('should be instantiable', function () {
            expect(EventBus).not.toThrow();
        });

        describe('notifyError method', function () {
            it('should exist', function () {
                var bus = new EventBus();
                expect(bus.notifyError).toBeOfType('function');
            });

            it('should fire error event', function () {
                var bus = new EventBus();
                var handler = jasmine.createSpy('handler');
                bus.on('error', handler);
                var error = new Error();
                bus.notifyError(error);

                expect(handler).toHaveBeenCalled();
                expect(handler.calls.mostRecent().args[0].error).toBe(error);
            });

            it('should wrap string to an Error object', function () {
                var bus = new EventBus();
                var handler = jasmine.createSpy('handler');
                bus.on('error', handler);
                bus.notifyError('foo');

                expect(handler.calls.mostRecent().args[0].error instanceof Error).toBe(true);
                expect(handler.calls.mostRecent().args[0].error.message).toBe('foo');
            });
        });
    });
});
