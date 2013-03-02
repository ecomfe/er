define(
    'book/ListModel',
    function() {
        var Model = require('er/Model');

        function BookListModel() {
            Model.apply(this, arguments);

            var queryArguments = {
                page: this.get('page'),
                keywords: this.get('keywords'),
                author: this.get('author'),
                publisher: this.get('publisher')
            };

            var datasource = require('er/datasource');
            this.datasource = {
                list: datasource.queryDatabase(queryArguments),
                locator: datasource.constant(require('er/locator'))
            };
        }


        BookListModel.prototype.prepare = function() {
            var list = this.get('list');
            this.set('list', list.result);
            this.set('page', list.page);

            var pages = [];
            for (var i = 1; i <= list.pageCount; i++) {
                pages.push(i);
            }
            this.set('pages', pages);
        };

        BookListModel.prototype.findBook = function(isbn) {
            var list = this.get('list');
            for (var i = 0; i < list.length; i++) {
                var book = list[i];
                if (book.isbn === isbn) {
                    return book;
                }
            }
            return null;
        };

        require('er/util').inherits(BookListModel, Model);

        return BookListModel;
    }
);