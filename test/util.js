define(function() {
    var util = require('er/util');
    
    describe('util', function() {
        it('should export `guid` method', function() {
            expect(util.guid).toBeOfType('function');
        });
        it('should export `mix` method', function() {
            expect(util.mix).toBeOfType('function');
        });
        it('should export `bind` method', function() {
            expect(util.bind).toBeOfType('function');
        });
        it('should export `noop` method', function() {
            expect(util.noop).toBeOfType('function');
        });
        it('should export `inherits` method', function() {
            expect(util.inherits).toBeOfType('function');
        });
        it('should export `parseJSON` method', function() {
            expect(util.parseJSON).toBeOfType('function');
        });
        it('should export `trim` method', function() {
            expect(util.trim).toBeOfType('function');
        });
        it('should export `encodeHTML` method', function() {
            expect(util.encodeHTML).toBeOfType('function');
        });
        describe('`guid` method', function() {
            it('should get unique id', function() {
                expect(util.guid()).not.toEqual(util.guid());
            });
        });
        describe('`mix` method', function() {
            it('should return the same object C', function() {
                var a = { 
                    "a": 1
                },
                b = {
                    "b" : 2
                },
                c = {
                    "a" : 1,
                    "b" : 2
                };
                expect(util.mix(a, b)).toEqual(c);
                expect(util.mix(a, b)).not.toBe(c);
            });
        });
        
        describe('`bind` method', function() {
            it('should accept  a function', function() {
                expect(function() { util.bind(function(){}) }).not.toThrow();
            });
        });
        
        describe('`inherits` method', function() {
            it('classA should be inherit superClassA', function() {
                function SuperClassA() {}
                SuperClassA.prototype = {
                    a: 1
                };
                function ClassA() {}
                ClassA.prototype = {};
                expect(util.inherits(ClassA, SuperClassA).prototype.a).toBeTruthy();
            });
        });
        describe('`parseJSON` method', function() {
            it('parseJSON(strA) should be equal to objA', function() {
                var strA = '{"a": "1"}';
                var objA = {
                    a : "1"
                };
                expect(util.parseJSON(strA)).toEqual(objA);
                expect(util.parseJSON(strA)).not.toBe(objA);
            });
        });
        describe('`trim` method', function() {
            it('str should not be whitespace in start or end', function() {
                var str = "   abc  ";
                expect(util.trim(str)).toEqual("abc");
            });
        });
        describe('`encodeHTML` method', function() {
            it('some mark should be encoded (such as <, >, &, \", \' )', function() {
                var str = "<\"\'&>";
                expect(util.encodeHTML(str).indexOf("<")).toEqual(-1);
                expect(util.encodeHTML(str).indexOf(">")).toEqual(-1);
                expect(util.encodeHTML(str).indexOf("\"")).toEqual(-1);
                expect(util.encodeHTML(str).indexOf("\'")).toEqual(-1);
            });
        });
    });
});
