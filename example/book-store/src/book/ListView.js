define(
    'book/ListView',
    function(require) {
        var View = require('er/View');

        function BookListView() {
            View.apply(this, arguments);
        }

        function buyBook(e) {
            var isbn = $(this).attr('data-isbn');
            this.fire('buy', { isbn: isbn });
        }

        function search() {
            var keywords = document.getElementById('keywords').value;
            this.fire('search', { keywords: keywords });
        }

        BookListView.prototype.template = 'bookList';

        BookListView.prototype.showBoughtTip = function(isbn) {
            var rows = document.getElementsByTagName('tr');
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (row.getAttribute('data-isbn') === isbn) {
                    var command = row.getElementsByTagName('span')[0];
                    command.innerText = '已购买';
                    command.removeAttribute('data-command');
                }
            }
        };

        require('er/util').inherits(BookListView, View);

        return BookListView;
    }
);