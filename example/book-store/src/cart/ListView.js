define(
    function(require) {
        require('er/tpl!./list.tpl');
        
        var View = require('er/View');

        function CartListView() {
            View.apply(this, arguments);
        }

        function plusBook(e) {
            var isbn = $(e.target).closest('tr').attr('data-isbn');
            this.fire('plus', { isbn: isbn });
        }

        function minusBook(e) {
            var isbn = $(e.target).closest('tr').attr('data-isbn');
            this.fire('minus', { isbn: isbn });
        }

        function removeBook(e) {
            var isbn = $(e.target).closest('tr').attr('data-isbn');
            this.fire('remove', { isbn: isbn });
        }

        function clearCart() {
            this.fire('clear');
        }

        CartListView.prototype.template = 'cartList';

        CartListView.prototype.enterDocument = function() {
            var util = require('er/util');
            $('#cart-list')
                .on(
                    'click', '.remove', util.bind(removeBook, this))
                .on(
                    'click', '.plus', util.bind(plusBook, this))
                .on(
                    'click', '.minus', util.bind(minusBook, this));
            $('#clear-cart').on('click', util.bind(clearCart, this));
        };

        require('er/util').inherits(CartListView, View);

        return CartListView;
    }
);