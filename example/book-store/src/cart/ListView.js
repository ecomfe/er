define(
    'cart/ListView',
    function(require) {
        var View = require('er/View');

        function CartListView() {
            View.apply(this, arguments);
        }

        function executeCommand(e) {
            var target = e.target;
            if (target.getAttribute('data-command') === 'remove') {
                var tr = target.parentNode;
                while (tr.nodeName.toLowerCase() !== 'tr') {
                    tr = tr.parentNode;
                }
                var isbn = tr.getAttribute('data-isbn');

                this.fire('remove', { isbn: isbn });
            }
            else if (target.getAttribute('data-command') === 'clear') {
                this.fire('clear');
            }
        }

        var template = [
            '<table id="cart-list">',
                '<thead>',
                    '<tr>',
                        '<th>书名</th>',
                        '<th>ISBN</th>',
                        '<th>作者</th>',
                        '<th>价格</th>',
                        '<th>操作</th>',
                    '</tr>',
                '</thead>',
                '<tbody>',
                    '{{#list}}',
                    '<tr data-isbn="{{isbn}}">',
                        '<td>{{name}}</td>',
                        '<td>{{isbn}}</td>',
                        '<td>{{author}}</td>',
                        '<td>{{price}}</td>',
                        '<td><span class="interactive" data-command="remove">移除</span></td>',
                    '</tr>',
                    '{{/list}}',
                '</tbody>',
                '<tfoot>',
                    '<tr>',
                        '<td>总计</td>',
                        '<td colspan="2">{{total}}</td>',
                        '<td><span class="interactive" data-command="clear">清空</span></td>',
                    '</tr>',
                '</tfoot>',
            '</table>'
        ];
        template = template.join('\n');
        CartListView.prototype.render = function() {
            var Mustache = require('Mustache');
            var html = Mustache.render(template, this.model.valueOf());
            document.getElementById(this.container).innerHTML = html;

            document.getElementById('cart-list')
                .addEventListener('click', executeCommand.bind(this), false);
        };

        require('er/util').inherits(CartListView, View);

        return CartListView;
    }
);