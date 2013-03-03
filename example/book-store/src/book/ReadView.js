define(
    'book/ReadView',
    function(require) {
        var View = require('er/View');

        function BookReadView() {
            View.apply(this, arguments);
        }

        BookReadView.prototype.template = 'bookView';

        require('er/util').inherits(BookReadView, View);

        return BookReadView;
    }
);