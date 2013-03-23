define(function() {
    var template = require('er/template');

    function customFilter(input) {
        return input + ' filtered';
    }

    var simpleTarget = [
        '<!-- target: simple -->',
        'This is a simple text'
    ];

    describe('template', function() {
        it('should export `addFilter` method', function() {
            expect(template.addFilter).toBeOfType('function');
        });

        it('should export `get` method', function() {
            expect(template.get).toBeOfType('function');
        });

        it('should export `parse` method', function() {
            expect(template.parse).toBeOfType('function');
        });

        it('should export `merge` method', function() {
            expect(template.merge).toBeOfType('function');
        });

        describe('`addFilter` method', function() {
            it('should accept a string and a function', function() {
                expect(function() { template.addFilter('custom', customFilter); }).not.toThrow();
            });
        });

        describe('`parse` method', function() {
            it('should accept a simple target', function() {
                expect(function() { template.parse(simpleTarget.join('')) }).not.toThrow();
            });
        });

        describe('`get` method', function() {
            it('should return the same content as it is parsed', function() {
                expect(template.get('simple')).toEqual(simpleTarget[1]);
            });
        });
    });
});