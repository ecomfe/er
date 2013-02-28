define(
    'cart/List',
    function(require) {
        var Action = require('er/Action');

        function CartList() {
            Action.apply(this, arguments);
        }

        CartList.prototype.createModel = function() {
            var cart = require('cart/init');
            return {
                list: cart.boughtItems,
                total: cart.calculateSum()
            };
        };

        CartList.prototype.viewType = require('cart/ListView');

        function removeBook(e) {
            var cart = require('cart/init');
            cart.remove(e.isbn);
            this.model.total = cart.calculateSum();

            this.view.render();
        }

        function clearCart() {
            var cart = require('cart/init');
            cart.clear();
            this.model.total = 0;

            this.view.render();
        }

        CartList.prototype.initBehavior = function() {
            this.view.on('remove', removeBook.bind(this));
            this.view.on('clear', clearCart.bind(this));
        };

        require('er/util').inherits(CartList, Action);

        return CartList;
    }
);