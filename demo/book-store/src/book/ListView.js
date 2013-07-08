define(
    function(require) {
        require('er/tpl!./list.tpl');

        var View = require('er/View');

        function BookListView() {
            View.apply(this, arguments);
        }

        function buyBook(e) {
            var isbn = $(e.target).closest('.book-info').attr('data-isbn');
            this.fire('buy', { isbn: isbn });
        }

        function search() {
            var keywords = document.getElementById('keywords').value;
            this.fire('search', { keywords: keywords });
        }

        function flip(e) {
            var page = e.target.getAttribute('data-page');
            if (/(\+|\-)/.test(page)) {
                page = parseInt(page) + (RegExp.$1 === '+' ? 1 : -1);
            }
            this.fire('flip', { page: page });
        }

        function hideBookInfo() {
            $('#book-info').removeClass('focused');
            $('#close-book-info').off('click');
        }

        function showBookInfo(action) {
            $('#book-info').addClass('focused');
            action.on('leave', hideBookInfo);
            $('#close-book-info').on(
                'click',
                require('er/util').bind(action.leave, action)
            );
        }

        BookListView.prototype.template = 'bookList';

        BookListView.prototype.enterDocument = function() {
            var container = $('#' + this.container);

            var util = require('er/util');
            $('#book-list').on('click', '.buy', util.bind(buyBook, this));
            $('#submit-search').on('click', util.bind(search, this));
            $('#list-page').on(
                'click', ':not(.disable)' , util.bind(flip, this));

            container.on(
                'click',
                '.name',
                function() {
                    var url = $(this).attr('href').substring(1);
                    var controller = require('er/controller');

                    this.loadingBookViewAction = 
                        controller.renderChildAction(url, 'book-info-panel');
                    this.loadingBookViewAction.done(showBookInfo);
                    return false;
                }
            );
        };

        BookListView.prototype.showBoughtTip = function(isbn) {
            require('book/effect').showBoughtTip.call(this, isbn);
        };

        require('er/util').inherits(BookListView, View);

        return BookListView;
    }
);