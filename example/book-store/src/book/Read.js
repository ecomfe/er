define(
    'book/Read',
    function(require) {
        var Action = require('er/Action');

        function BookRead() {
            Action.apply(this, arguments);
        }

        BookRead.prototype.createModel = function(context) {
            var Model = require('er/Model');
            var model = new Model(context);
            var options = {
                data: {
                    isbn: context.isbn
                }
            };
            model.datasource = 
                require('er/datasource').remote('/book/read', options);
            return model;
        };

        BookRead.prototype.viewType = require('book/ReadView');

        require('er/util').inherits(BookRead, Action);

        return BookRead;
    }
);