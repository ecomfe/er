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

        BookReadView.prototype.boughtBook = function(isbn) {
            require('book/effect').showBoughtTip.call(this, isbn);
        };

        BookReadView.prototype.enterDocument = function() {
            $('#buy').click(require('er/util').bindFn(buyBook, this));
        };
        
        require('er/util').inherits(BookReadView, View);

        return BookReadView;
    }
);