define(
    'book/List',
    function(require) {
        var Action = require('er/Action');

        function BookList() {
            Action.apply(this, arguments);
        }

        BookList.prototype.modelType = require('book/ListModel');

        BookList.prototype.viewType = require('book/ListView');

        require('er/util').inherits(BookList, Action);

        return BookList;
    }
);