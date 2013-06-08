define(
    function(require) {
        var actions = [
            {
                path: '/404',
                type: 'common/NotFound'
            }
        ];

        var controller = require('er/controller');
        actions.forEach(controller.registerAction);
    }
);