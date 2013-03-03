define(
    'cart/init',
    function(require) {
        var actions = [
            {
                path: '/cart/list',
                type: 'cart/List'
            }
        ];

        var controller = require('er/controller');
        actions.forEach(controller.registerAction);

        return {
            boughtBooks: [],

            add: function(book) {
                this.boughtBooks.push(book);
            },

            remove: function(isbn) {
                for (var i = 0; i < this.boughtBooks.length; i++) {
                    if (this.boughtBooks[i].isbn === isbn) {
                        this.boughtBooks.splice(i, 1);
                        return;
                    }
                }
            },

            clear: function() {
                this.boughtBooks.length = 0;
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
    }
);