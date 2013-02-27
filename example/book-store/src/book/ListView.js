define(
    'book/ListView',
    function(require) {
        var View = require('er/View');

        function BookListView() {
            View.apply(this, arguments);
        }

        var template = [
            '<div id="search">',
                '<input id="keywords" value="{{keywords}}" />',
                '<span id="submit">检索</span>',
            '</div>',
            '<table id="book-list">',
                '<thead>',
                    '<tr>',
                        '<th>书名</th>',
                        '<th>ISBN</th>',
                        '<th>作者</th>',
                        '<th>操作</th>',
                    '</tr>',
                '</thead>',
                '<tbody>',
                    '{{#list}}',
                    '<tr' + '{{#recommend}} class="recommend"{{/recommend}}' + '>',
                        '<td>{{name}}</td>',
                        '<td>{{isbn}}</td>',
                        '<td>{{author}}</td>',
                        '<td><a href="#/book/read~isbn={{isbn}}">查看</a></td>',
                    '</tr>',
                    '{{/list}}',
                '</tbody>',
            '</table>',
            '<div id="pager">',
                '{{#pages}}',
                '<a href="#/book/list~keywords={{keywords}}&page={{.}}">{{.}}</a>',
                '{{/pages}}',
            '</div>'
        ];
        template = template.join('\n');
        BookListView.prototype.render = function() {
            var Mustache = require('Mustache');
            var html = Mustache.render(template, this.model.valueOf());
            document.getElementById(this.container).innerHTML = html;

            var page = this.model.get('page');
            document.getElementById('submit').addEventListener(
                'click',
                function() {
                    var keywords = document.getElementById('keywords').value;
                    var locator = require('locator');
                    var URL = require('er/URL');
                    var query = { keywords: keywords };
                    locator.redirect(URL.withQuery('/book/list', query));
                },
                false
            );
        }

        require('er/util').inherits(BookListView, View);

        return BookListView;
    }
);