define(
    function(require) {
        var Action = require('er/Action');
        require('er/tpl!./notFound.tpl');

        function NotFound() {
            Action.apply(this, arguments);
        }

        NotFound.prototype.modelType = require('er/Model');

        NotFound.prototype.createView = function () {
            var View = require('er/View');
            var view = new View();
            view.template = 'notFound';
            return view;
        }

        require('er/util').inherits(NotFound, Action);

        return NotFound;
    }
);