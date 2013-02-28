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
            boughtItems: [],

            add: function(book) {
                this.boughtItems.push(book);
            },

            remove: function(isbn) {
                for (var i = 0; i < this.boughtItems.length; i++) {
                    if (this.boughtItems[i].isbn === isbn) {
                        this.boughtItems.splice(i, 1);
                        return;
                    }
                }
            },

            clear: function() {
                this.boughtItems.length = 0;
            },

            calculateSum: function() {
                var sum = this.boughtItems.reduce(
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