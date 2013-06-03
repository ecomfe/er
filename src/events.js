define(
    function (require) {
        /**
         * 事件中心
         * 
         * 现有事件如下：
         * 
         * `error`：接收到错误时发出
         */
        var events = {
            /**
             * 通知一个错误的产生
             *
             * @param {*} error 错误对象，如果是字符串则会被封装为一个Error对象
             */
            notifyError: function (error) {
                if (typeof error === 'string') {
                    error = new Error(error);
                }

                /**
                 * 接收到错误时触发
                 * 
                 * @event error
                 * @param {Object} e 事件对象
                 * @param {*} e.error 抛出的错误对象
                 */
                this.fire('error', { error: error });

                return error;
            }
        };

        require('./Observable').enable(events);

        return events;
    }
);