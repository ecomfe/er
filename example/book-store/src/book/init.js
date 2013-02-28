define(
    'book/init',
    function(require) {
        var actions = [
            {
                path: '/book/list',
                type: 'book/List'
            },
            {
                path: '/book/read',
                type: 'book/Read'
            }
        ];

        var controller = require('er/controller');
        actions.forEach(controller.registerAction);

        var books = [];
        for (var i = 0; i < 111; i++) {
            var book = {
                isbn: 1024 + i + '',
                name: '图书' + i,
                author: 'Anonymous',
                price: parseFloat((Math.random() * 100 + 20).toFixed(2))
            };
            books.push(book);
        }
        var mockup = require('common/mockup');

        function clone(o) {
            return JSON.parse(JSON.stringify(o));
        }

        mockup.add(
            '/book/list',
            function(options) {
                function filterKeywords(book) {
                    return book.name.indexOf(options.data.keywords) >= 0;
                }

                var list = options.data.keywords
                    ? books.filter(filterKeywords)
                    : books;
                var page = +options.data.page || 1;
                var pageSize = 10;
                var start = (page - 1) * pageSize;

                return {
                    result: list.slice(start, start + pageSize).map(clone),
                    page: page,
                    pageCount: list.length % pageSize === 0
                        ? list.length / pageSize
                        : Math.ceil(list.length / pageSize)
                };
            }
        );
        mockup.add(
            '/book/read',
            function(options) {
                var result = books.filter(
                    function(b) {
                        return b.isbn + '' === options.data.isbn;
                    }
                );
                return result[0];
            }
        );
    }
);