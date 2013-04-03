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
            it('function foo1 execute, the variable ,isAttach is true', function() {
                evtObj.on("test", foo1);
                evtObj.fire("test");
                expect(isAttach).toBeTruthy();
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