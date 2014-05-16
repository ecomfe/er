beforeEach(function() {
    jasmine.addMatchers({
        toBeOfType: function () {
            return {
                compare: function (actual, type) {
                    var result = {
                        pass: {}.toString.call(actual).slice(8, -1).toUpperCase() === type.toUpperCase()
                    };
                    return result;
                }
            }
        }
    });
});