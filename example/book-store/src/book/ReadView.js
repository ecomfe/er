define(
    'book/ReadView',
    function(require) {
        var View = require('er/View');

        function BookReadView() {
            View.apply(this, arguments);
        }

        var template = [
            '<div class="row">',
                '<span class="field-name">ISBN</span>',
                '<span class="field-value">{{isbn}}</span>',
            '</div>',
            '<div class="row">',
                '<span class="field-name">书名</span>',
                '<span class="field-value">{{name}}</span>',
            '</div>',
            '<div class="row">',
                '<span class="field-name">作者</span>',
                '<span class="field-value">{{author}}</span>',
            '</div>',
            '<div class="row">',
                '<span class="field-name">价格</span>',
                '<span class="field-value">{{price}}</span>',
            '</div>',
            '<a href="#/book/list">返回列表</a>'
        ];
        template = template.join('\n');
        BookReadView.prototype.render = function() {
            var Mustache = require('Mustache');
            var html = Mustache.render(template, this.model.valueOf());
            document.getElementById(this.container).innerHTML = html;
        };

        require('er/util').inherits(BookReadView, View);

        return BookReadView;
    }
);