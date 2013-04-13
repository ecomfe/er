define(function() {
    var permission = require('er/permission');
    var data = {
        books: { VIEW_BOOK: true, EDIT_BOOK: false },
        authors: { VIEW_AUTHOR: true, EDIT_AUTHOR: true }
    };
    
    describe('permission', function() {
        it('should export `add` method', function() {
            expect(permission.add).toBeOfType('function');
        });
        it('should export `isAllow` method', function() {
            expect(permission.isAllow).toBeOfType('function');
        });

        describe('`add` method', function() {
            it('data object  should has the permission', function() {
                permission.add(data);
                expect(permission.isAllow("VIEW_BOOK")).toBeTruthy();
            });
        });
       describe('`isAllow` method', function() {
            it(' should hasn\'t the permission of EDIT_BOOK', function() {
                expect(permission.isAllow("EDIT_BOOK")).toBeFalsy();
            });
        });
    });
});
