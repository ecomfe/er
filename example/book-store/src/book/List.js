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
            var locator = this.model.get('locator');
            var URL = require('er/URL');
            locator.redirect(URL.withQuery('/book/list', query));
        }

        function flip(e) {
            var query = { page: e.page };
            var locator = this.model.get('locator');
            var URL = require('er/URL');
            var cURL = this.model.get('url');
            locator.redirect(URL.withQuery(cURL.getPath(),
                require('er/util').mix(cURL.getQuery(), query)));
        }

        BookList.prototype.initBehavior = function() {
            var util = require('er/util');
            this.view.on('buy', util.bindFn(buyBook, this));
            this.view.on('search', util.bindFn(search, this));
            this.view.on('flip', util.bindFn(flip, this));
        };

        require('er/util').inherits(BookList, Action);

        return BookList;
    }
);