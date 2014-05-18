define(
    function (require) {
        function Empty() {
            this.enter = jasmine.createSpy('enter');
            this.leave = jasmine.createSpy('leave');
            Empty.mostRecentInstance = this;
        }

        return Empty;
    }
);
