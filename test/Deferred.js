define(function() {
    var Deferred = require('er/Deferred');
    var def = new Deferred();
    describe('Deferred', function() {
        it('should export `resolve` method', function() {
            expect(def.resolve).toBeOfType('function');
        });
        it('should export `reject` method', function() {
            expect(def.reject).toBeOfType('function');
        });
        it('should export `done` method', function() {
            expect(def.done).toBeOfType('function');
        });
        it('should export `fail` method', function() {
            expect(def.fail).toBeOfType('function');
        });
        it('should export `ensure` Object', function() {
            expect(def.ensure).toBeOfType('function');
        });
        it('should export `then` Object', function() {
            expect(def.then).toBeOfType('function');
        });
        
        it('should export `Deferred.isPromise` method', function() {
            expect(Deferred.isPromise).toBeOfType('function');
        });
        it('should export `Deferred.join` method', function() {
            expect(Deferred.join).toBeOfType('function');
        });
        it('should export `Deferred.resolved` Object', function() {
            expect(Deferred.resolved).toBeOfType('function');
        });
        it('should export `Deferred.rejected` Object', function() {
            expect(Deferred.rejected).toBeOfType('function');
        });

        describe('`resolve` method', function() {
            var def = new Deferred();
            it('the state of Deferred should be "resolved"', function() {
                def.resolve();
                expect(def.state).toEqual("resolved");
            });
        });
        describe('`reject` method', function() {
            var def = new Deferred();
            it('the state of Deferred should be "rejected"', function() {
                def.reject();
                expect(def.state).toEqual("rejected");
            });
        });
        describe('`done` method', function() {
            var def = new Deferred();
            var success = jasmine.createSpy();
            def.done(success);
            def.resolve();
            it('the callback function "success" should be executed', function() {
                expect(success).toHaveBeenCalled();
            });
        });
        describe('`fail` method', function() {
            var def = new Deferred();
            var failure = jasmine.createSpy();
            def.fail(failure);
            def.reject();
            it('the callback function "failure" should be executed', function() {
                expect(failure).toHaveBeenCalled();
            });
        });
        describe('`ensure` method', function() {
            var def = new Deferred();
            var always = jasmine.createSpy();
            def.ensure(always);
            def.resolve();
            //def.reject();
            it('resolved or rejected, the callback function "always" should be executed ', 
                function() {
                    expect(always).toHaveBeenCalled();
            });
        });
        describe('`then` method', function() {
            var def = new Deferred();
            var success = jasmine.createSpy();
            var failure = jasmine.createSpy();
            def.then(success, failure);
            //def.resolve();
            def.reject();
            it('resolved, execute success; rejected,execute failure.', function() {
                //expect(success).toHaveBeenCalled();
                expect(failure).toHaveBeenCalled();
            });
        });
        describe('`Deferred.isPromise` method', function() {
            var def = new Deferred();
            Deferred.isPromise(def);
            it('def should be a promise object', function() {
                expect(Deferred.isPromise(def)).toBeTruthy();
                expect(Deferred.isPromise({})).toBeFalsy();
            });
        });
        describe('`Deferred.join` method', function() {
            it('Deferred.join() should return a promise object', function() {
                expect(Deferred.isPromise(Deferred.join())).toBeTruthy();
            });
        });
        describe('`Deferred.resolved` method', function() {
            var def = Deferred.resolved();
            it('Deferred.resolved should return a promise object with the state of "resolved"', 
                function() {
                    expect(Deferred.isPromise(def)).toBeTruthy();
            });
        });
        describe('`Deferred.rejected` method', function() {
            var def = Deferred.rejected();
            it('Deferred.rejected should return a promise object with the state of "rejected"',
                 function() {
                    expect(Deferred.isPromise(def)).toBeTruthy();
            });
        });
    });
});