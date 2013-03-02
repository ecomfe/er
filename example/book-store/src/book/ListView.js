define(
    'book/ListView',
    function(require) {
        var View = require('er/View');

        function BookListView() {
            View.apply(this, arguments);
        }

        function buyBook(e) {
            var target = e.target;
            if (target.getAttribute('data-command') === 'buy') {
                var tr = target.parentNode;
                while (tr.nodeName.toLowerCase() !== 'tr') {
                    tr = tr.parentNode;
                }
                var isbn = tr.getAttribute('data-isbn');

                this.fire('buy', { isbn: isbn });
            }
        }

        function search() {
            var keywords = document.getElementById('keywords').value;
            this.fire('search', { keywords: keywords });
        }

        // var template = [
        //     '<div id="search">',
        //         '<input id="keywords" value="{{keywords}}" />',
        //         '<span id="submit">检索</span>',
        //     '</div>',
        //     '<table id="book-list">',
        //         '<thead>',
        //             '<tr>',
        //                 '<th>书名</th>',
        //                 '<th>ISBN</th>',
        //                 '<th>作者</th>',
        //                 '<th>价格</th>',
        //                 '<th>操作</th>',
        //             '</tr>',
        //         '</thead>',
        //         '<tbody>',
        //             '{{#list}}',
        //             '<tr data-isbn={{isbn}}' + '{{#recommend}} class="recommend"{{/recommend}}' + '>',
        //                 '<td>{{name}}</td>',
        //                 '<td>{{isbn}}</td>',
        //                 '<td>{{author}}</td>',
        //                 '<td>{{price}}</td>',
        //                 '<td>',
        //                     '<a href="#/book/read~isbn={{isbn}}">查看</a>',
        //                     '<span class="interactive" data-command="buy">购买</span>',
        //                 '</td>',
        //             '</tr>',
        //             '{{/list}}',
        //         '</tbody>',
        //     '</table>',
        //     '<div id="pager">',
        //         '{{#pages}}',
        //         '<a href="#/book/list~keywords={{keywords}}&page={{.}}">{{.}}</a>',
        //         '{{/pages}}',
        //     '</div>'
        // ];
        // template = template.join('\n');

        BookListView.prototype.template = 'bookList';
        
        // BookListView.prototype.render = function() {
        //     var Mustache = require('Mustache');
        //     var html = Mustache.render(template, this.model.valueOf());
        //     document.getElementById(this.container).innerHTML = html;

        //     document.getElementById('submit').
        //         addEventListener('click', search.bind(this), false);

        //     document.getElementById('book-list')
        //         .addEventListener('click', buyBook.bind(this), false);
        // };

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