define(
    function(require) {
        var actions = [
            {
                path: '/cart/list',
                type: 'cart/List'
            }
        ];

        var controller = require('er/controller');
        actions.forEach(controller.registerAction);

        var cart = {
            boughtBooks: [],

            add: function(book) {
                this.boughtBooks.push(book);
                this.fire('add', book);
            },

            remove: function(isbn) {
                for (var i = 0; i < this.boughtBooks.length; i++) {
                    if (this.boughtBooks[i].isbn === isbn) {
                        this.boughtBooks.splice(i, 1);
                        break;
                    }
                }
                this.fire('remove', isbn);
            },

            clear: function() {
                this.boughtBooks.length = 0;
                this.fire('clear');
            },

            calculateSum: function() {
                var sum = this.boughtBooks.reduce(
                    function(sum, b) {
                        return sum + b.price;
                    },
                    0
                );
                return parseFloat(sum.toFixed(2));
            }
        };
        require('er/Observable').enable(cart);

        return cart;
    }
);