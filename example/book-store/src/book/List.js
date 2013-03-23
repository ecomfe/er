define(
    function(require) {
        var Action = require('er/Action');

        function BookList() {
            Action.apply(this, arguments);
        }

        BookList.prototype.modelType = require('book/ListModel');

        BookList.prototype.viewType = require('book/ListView');

        function buyBook(e) {
            var book = this.model.find(e.isbn);
            var cart = require('cart/init');
            cart.add(book);
            this.view.showBoughtTip(e.isbn);
        }

        function search(e) {
            var query = { keywords: e.keywords };
            var URL = require('er/URL');
            this.redirect(URL.withQuery('/book/list', query));
        }

        function flip(e) {
            var query = { page: e.page };
            var URL = require('er/URL');
            var cURL = this.model.get('url');
            this.redirect(
                URL.withQuery(
                    cURL.getPath(),
                    require('er/util').mix(cURL.getQuery(), query)
                )
            );
        }

        BookList.prototype.initBehavior = function() {
            var util = require('er/util');
            this.view.on('buy', util.bind(buyBook, this));
            this.view.on('search', util.bind(search, this));
            this.view.on('flip', util.bind(flip, this));
        };

        require('er/util').inherits(BookList, Action);

        return BookList;
    }
);