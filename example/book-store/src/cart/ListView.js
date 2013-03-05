define(
    function(require) {
        var View = require('er/View');

        function CartListView() {
            View.apply(this, arguments);
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
            $('#cart-list').on(
                'click', '.remove', util.bindFn(removeBook, this));
            $('#clear-cart').on('click', util.bindFn(clearCart, this));
        };

        require('er/util').inherits(CartListView, View);

        return CartListView;
    }
);