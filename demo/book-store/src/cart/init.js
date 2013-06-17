define(
    function(require) {
        var actions = [
            {
                path: '/cart/list',
                type: 'cart/List',
                title: '购物车'
            }
        ];

        var controller = require('er/controller');
        _.forEach(actions, controller.registerAction);

        var cart = {
            boughtBooks: [],
            find: function(isbn) {
                var i = this.boughtBooks.length;
                while (i--) {
                    if (this.boughtBooks[i].isbn === isbn) {
                        return i;
                    }
                }
                return -1;
            },

            add: function(book) {
                var cartIndex = this.find(book.isbn);
                if (cartIndex > -1) {
                    this.plus(book.isbn);
                }
                else {
                    book.count = 1;
                    this.boughtBooks.push(book);
                }
                this.fire('add', book);
            },

            plus: function(isbn) {
                var cartIndex = this.find(isbn);
                if (cartIndex > -1) {
                    this.boughtBooks[cartIndex].count++;
                    this.fire('plus', isbn);
                }
            },

            minus: function(isbn) {
                var cartIndex = this.find(isbn);
                if (cartIndex > -1) {
                    var book = this.boughtBooks[cartIndex];
                    book.count--;
                    if (book.count < 0) {
                        book.count = 0;
                    }
                    this.fire('minus', isbn);
                }
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
                var sum = _.reduce(
                    this.boughtBooks,
                    function(sum, b) {
                        return sum + b.price * b.count;
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