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
        it('should export `Deferred.all` method', function() {
            expect(Deferred.all).toBeOfType('function');
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
        describe('`all` method', function() {
            it('should return a promise object', function() {
                expect(Deferred.isPromise(Deferred.all())).toBeTruthy();
            });
        });
        describe('`resolved` method', function() {
            var def = Deferred.resolved();
            it('should return a promise object with the state of "resolved"',
                function() {
                    expect(Deferred.isPromise(def)).toBeTruthy();
            });
        });
        describe('`rejected` method', function() {
            var def = Deferred.rejected();
            it('should return a promise object with the state of "rejected"',
                 function() {
                    expect(Deferred.isPromise(def)).toBeTruthy();
            });
        });
        describe('when sync mode is enabled', function () {
            it('should invoke `done` callbacks immediately when resolved', function () {
                var deferred = new Deferred();
                deferred.syncModeEnabled = true;
                var callback = jasmine.createSpy();
                deferred.promise.done(callback);
                deferred.resolver.resolve(1);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls.mostRecent().args[0]).toBe(1);
            });

            it('should invoke `fail` callbacks immediately when resolved', function () {
                var deferred = new Deferred();
                deferred.syncModeEnabled = true;
                var callback = jasmine.createSpy();
                deferred.promise.fail(callback);
                deferred.resolver.reject(1);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls.mostRecent().args[0]).toBe(1);
            });

            it('should invoke `done` callbacks attached after resolution immediately', function () {
                var deferred = new Deferred();
                deferred.syncModeEnabled = true;
                var callback = jasmine.createSpy();
                deferred.resolver.resolve(1);
                deferred.promise.done(callback);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls.mostRecent().args[0]).toBe(1);
            });

            it('should invoke `fail` callbacks attached after rejection immediately', function () {
                var deferred = new Deferred();
                deferred.syncModeEnabled = true;
                var callback = jasmine.createSpy();
                deferred.resolver.reject(1);
                deferred.promise.fail(callback);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls.mostRecent().args[0]).toBe(1);
            });

            it('should spawn a promise object with sync mode enabled from its `then` method', function () {
                var deferred = new Deferred();
                deferred.syncModeEnabled = true;

                var promise = deferred.then(function () { return 1; });
                var callback = jasmine.createSpy();
                promise.fail(callback);

                deferred.resolver.reject(1);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls.mostRecent().args[0]).toBe(1);
            });
        });

        describe('`when` method', function () {
            it('should be defined on `Deferred` object', function () {
                expect(Deferred.when).toBeOfType('function');
            });

            it('should return the original object if given a `Promise`', function () {
                var promise = Deferred.resolved(1);
                expect(Deferred.when(promise)).toBe(promise);
            });

            it('should return a resolved Deferred with `syncModeEnabled` switch on if given a non-promise value', function () {
                var value = {};
                var promise = Deferred.when(value);
                expect(Deferred.isPromise(promise)).toBe(true);
                var resolvedValue = null;
                promise.then(function (x) { resolvedValue = x; });
                expect(resolvedValue).toBe(value);
            });
        });

        describe('event', function () {
            it('should have event system enabled', function () {
                expect(Deferred.on).toBeOfType('function');
                expect(Deferred.un).toBeOfType('function');
                expect(Deferred.fire).toBeOfType('function');
            });

            it('should fire `resolve` event whenver a deferred is resolved', function () {
                var deferred = new Deferred();
                var handler = jasmine.createSpy('handler');
                Deferred.on('resolve', handler);
                deferred.resolve();
                expect(handler).toHaveBeenCalled();
                Deferred.un('resolve', handler);
            });

            it('should pass arguments to `resolve` event', function () {
                var deferred = new Deferred();
                var handler = jasmine.createSpy('handler');
                Deferred.on('resolve', handler);
                deferred.resolve(1, 2, 3);
                expect(handler).toHaveBeenCalled();
                Deferred.un('resolve', handler);
                var event = handler.calls.mostRecent().args[0];
                expect(event).toBeOfType('object');
                expect(event.deferred).toBe(deferred);
                expect(event.type).toBe('resolve');
                expect(event.args).toEqual([1, 2, 3]);
                expect(event.reason).toBe(1);
            });

            it('should fire `reject` event whenver a deferred is rejected', function () {
                var deferred = new Deferred();
                var handler = jasmine.createSpy('handler');
                Deferred.on('reject', handler);
                deferred.reject();
                expect(handler).toHaveBeenCalled();
                Deferred.un('reject', handler);
            });

            it('should pass arguments to `reject` event', function () {
                var deferred = new Deferred();
                var handler = jasmine.createSpy('handler');
                Deferred.on('reject', handler);
                deferred.reject(1, 2, 3);
                expect(handler).toHaveBeenCalled();
                Deferred.un('reject', handler);
                var event = handler.calls.mostRecent().args[0];
                expect(event).toBeOfType('object');
                expect(event.deferred).toBe(deferred);
                expect(event.type).toBe('reject');
                expect(event.args).toEqual([1, 2, 3]);
                expect(event.reason).toBe(1);
            });

            it('should fire `exception` event whenver a call throws error', function (done) {
                var deferred = new Deferred();
                var error = new Error;
                var handler = jasmine.createSpy('handler');
                Deferred.on('exception', handler);
                deferred.then(function () { throw error; })
                    .fail(function () {
                        expect(handler).toHaveBeenCalled();
                    }).ensure(done);
                deferred.resolve();
            });
        });
    });
});