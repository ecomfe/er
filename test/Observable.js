define(function() {
    var Observable = require('er/Observable');
    var evtObj = new Observable();
    var isAttach = false;
    function foo1 () {
        isAttach = true;
    }
    describe('Observable', function() {
        it('should export `on` method', function() {
            expect(evtObj.on).toBeOfType('function');
        });
        it('should export `un` method', function() {
            expect(evtObj.un).toBeOfType('function');
        });
        it('should export `fire` method', function() {
            expect(evtObj.fire).toBeOfType('function');
        });
        it('should export `enable` method', function() {
            expect(Observable.enable).toBeOfType('function');
        });
        
        describe('`on` method', function() {
            it('function foo1 should  execute, the variable ,isAttach is true', function() {
                evtObj.on("test", foo1);
                evtObj.fire("test");
                expect(isAttach).toBeTruthy();
                this.after(function() { isAttach = false; });
            });
        });
        describe('`un` method', function() {
            it('function foo1 not execute, the variable ,isAttach is false', function() {
                evtObj.un("test", foo1);
                evtObj.fire("test");
                expect(isAttach).toBeFalsy();
            });
        });
        describe('`fire` method', function() {
            var o = new Observable();
            var handler = jasmine.createSpy('test');
            var allHandler = jasmine.createSpy('*');
            var arg = { type: 'what', x: 1 };
            o.on('test', handler);
            o.on('*', allHandler);
            o.fire('test', arg);

            it('should execute the event handler attached to the actual event type', function () {
                expect(handler).toHaveBeenCalled();
            });

            it('should execute the event handler attached to the event type `*`', function () {
                expect(allHandler).toHaveBeenCalled();
            });

            it('should execute the event handler with correct arguments', function () {
                expect(handler.mostRecentCall.args.length).toBe(1);
                expect(allHandler.mostRecentCall.args.length).toBe(1);
                expect(handler.mostRecentCall.args[0].x).toBe(1);
                expect(allHandler.mostRecentCall.args[0].x).toBe(1);
            });

            it('should override the `type` property if it exists', function () {
                expect(handler.mostRecentCall.args[0].type).toBe('test');
                expect(allHandler.mostRecentCall.args[0].type).toBe('test');
            });

            it('should give an empty object as event object if it is not given when firing', function () {
                var o = new Observable();
                var handler = jasmine.createSpy();
                o.on('test', handler);
                o.fire('test');
                expect(handler).toHaveBeenCalled();
                expect(handler.mostRecentCall.args[0]).toBeOfType('object');
                expect(handler.mostRecentCall.args[0].type).toBe('test');
            });

            it('should accept one argument, with `type` property in it', function () {
                var o = new Observable();
                var handler = jasmine.createSpy();
                o.on('test', handler);
                o.fire({ type: 'test', data: 1 });
                expect(handler).toHaveBeenCalled();
                expect(handler.mostRecentCall.args[0].type).toBe('test');
                expect(handler.mostRecentCall.args[0].data).toBe(1);
            });
        });

        describe('`enable` method', function() {
            it('make a Object has the function of Class Observable without inherit', function() {
                var obj = {};
                Observable.enable(obj);
                expect(obj.on).toBe(Observable.prototype.on);
                expect(obj.un).toBe(Observable.prototype.un);
                expect(obj.fire).toBe(Observable.prototype.fire);
            });
        });
    });
});