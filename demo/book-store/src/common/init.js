define(
    function(require) {
        var actions = [
            {
                path: '/404',
                type: 'common/NotFound',
                title: '未找到该页'
            }
        ];

        var controller = require('er/controller');
        actions.forEach(controller.registerAction);
    }
);