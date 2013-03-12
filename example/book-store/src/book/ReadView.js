define(
    function(require) {
        var View = require('er/View');

        function BookReadView() {
            View.apply(this, arguments);
        }

        function buyBook() {
            this.fire('buy');
        }

        BookReadView.prototype.template = 'bookView';

        BookReadView.prototype.boughtBooks = function(isbn) {
            require('book/ListView').prototype.showBoughtTip.call(this, isbn);
        };

        BookReadView.prototype.enterDocument = function() {
            $('#book-list').on('click', '.buy', require('er/util').bindFn(buyBook, this));
        };
        
        require('er/util').inherits(BookReadView, View);

        return BookReadView;
    }
);