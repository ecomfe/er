define(
    function(require) {
        var Action = require('er/Action');
        var cart = require('cart/init');

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

        function plusBook(e) {
            cart.plus(e.isbn);
            this.model.total = cart.calculateSum();

            this.view.render();
        }

        function minusBook(e) {
            cart.minus(e.isbn);
            this.model.total = cart.calculateSum();

            this.view.render();
        }

        function removeBook(e) {
            cart.remove(e.isbn);
            this.model.total = cart.calculateSum();

            this.view.render();
        }

        function clearCart() {
            cart.clear();
            this.model.total = 0;

            this.view.render();
        }

        CartList.prototype.initBehavior = function() {
            var util = require('er/util');
            this.view.on('plus', util.bindFn(plusBook, this));
            this.view.on('minus', util.bindFn(minusBook, this));
            this.view.on('remove', util.bindFn(removeBook, this));
            this.view.on('clear', util.bindFn(clearCart, this));
        };

        require('er/util').inherits(CartList, Action);

        return CartList;
    }
);