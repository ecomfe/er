define(function() {
    var URL = require('er/URL');
    var url = 'http://www.baidu.com/mypath#myhash~myquery=diaoshi';
    var path = 'http://www.baidu.com/mypath#myhash';
    
    describe('URL', function() {
        it('should export `parse` method', function() {
            expect(URL.parse).toBeOfType('function');
        });
        it('should export `withQuery` method', function() {
            expect(URL.withQuery).toBeOfType('function');
        });
        it('should export `parseQuery` method', function() {
            expect(URL.parseQuery).toBeOfType('function');
        });
        it('should export `serialize` method', function() {
            expect(URL.serialize).toBeOfType('function');
        });
        it('should export `empty` Object', function() {
            expect(URL.empty).toBeOfType('object');
        });

        describe('`parse` method', function() {
            it('should parse url and get the path', function() {
                expect(URL.parse(url).getPath()).toEqual(path);
            });
        });
        describe('`withQuery` method', function() {
            var queryObj = {
                myquery: "diaoshi"
            };
            it('should Return URL Object with the query', function() {
                expect(URL.withQuery(path, queryObj).getQuery()).toEqual(URL.parse(url).getQuery());
            });
        });
        describe('`parseQuery` method', function() {
            var queryStr = "myquery=diaoshi";
            var queryObj = {
                myquery: "diaoshi"
            };
            it('should return query Object based on query string', function() {
                expect(URL.parseQuery(queryStr)).toEqual(queryObj);
            });
        });
        describe('`serialize` method', function() {
            var queryStr = "myquery=diaoshi";
            var queryObj = {
                myquery: "diaoshi"
            };
            it('should return query string based on query object', function() {
                expect(URL.serialize(queryObj)).toEqual(queryStr);
            });
        });
    });
});