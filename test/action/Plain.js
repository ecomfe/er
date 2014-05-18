define(
    function (require) {
        function Plain() {
            this.enter = jasmine.createSpy('enter');
            this.leave = jasmine.createSpy('leave');
            Plain.mostRecentInstance = this;
        }

        return Plain;
    }
);
