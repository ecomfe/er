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

        describe('`compare` method', function () {
            var x = URL.parse('/foo/bar~x=1&y=2');
            var y = URL.parse('/foo/bar~x=2');
            var z = URL.parse('/bar~x=1&y=1');
            var o = URL.parse('/foo~x=1&y=2');
            var p = URL.parse('/foo/bar~x=1&y=2&z=3');

            it('should exists', function () {
                expect(x.compare).toBeOfType('function');
            });

            it('should compare path', function () {
                var diff = x.compare(z);
                expect(diff.path).toEqual({
                    key: 'path',
                    self: '/foo/bar',
                    other: '/bar'
                });
            });

            it('should compare query to include the same query with different values', function () {
                var diff = x.compare(y);
                expect(diff.query.x).toEqual({
                    key: 'x',
                    self: '1',
                    other: '2'
                });
            });

            it('should compare query but exclude those with same value', function () {
                var diff = x.compare(z);
                expect(diff.query.z).toBeUndefined();
            });

            it('should include all query differences in `queryDifference` property', function () {
                var diff = x.compare(y);
                expect(diff.queryDifference.length).toBe(2);
                expect(diff.queryDifference[0].key === 'x' || diff.queryDifference[1].key === 'x').toBe(true);
                expect(diff.queryDifference[0].key === 'y' || diff.queryDifference[1].key === 'y').toBe(true);
            });

            it('should set `path` to `false` if path is identical', function () {
                var diff = x.compare(y);
                expect(diff.path).toBe(false);
            });

            it('should set `query` to `false` if query is identical', function () {
                var diff = x.compare(o);
                expect(diff.query).toBe(false);
                expect(diff.queryDifference.length).toBe(0);
            });

            it('should include query which another have but self does not', function () {
                var diff = x.compare(p);
                expect(diff.query.z).toEqual({
                    key: 'z',
                    self: undefined,
                    other: '3'
                });
                expect(diff.queryDifference.length).toBe(1);
            });
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