define(
    function(require) {
        var Action = require('er/Action');

        function BookRead() {
            Action.apply(this, arguments);
        }

        function buyBook() {
            require('cart/init').add(this.model.valueOf());
            this.view.boughtBook(this.model.get('isbn'));
        }

        BookRead.prototype.createModel = function(context) {
            var Model = require('er/Model');
            var model = new Model(context);
            model.datasource = function(model) {
                return require('common/database').find(model.get('isbn'));
            };
            return model;
        };

        BookRead.prototype.viewType = require('book/ReadView');

        BookRead.prototype.initBehavior = function() {
            this.view.on('buy', require('er/util').bind(buyBook, this))
        };

        require('er/util').inherits(BookRead, Action);

        return BookRead;
    }
);