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
                list: cart.boughtBooks || [],
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
            var util = require('er/util');
            this.view.on('remove', util.bindFn(removeBook, this));
            this.view.on('clear', util.bindFn(clearCart, this));
        };

        require('er/util').inherits(CartList, Action);

        return CartList;
    }
);