define(
    function(require) {
        function showBoughtTip(isbn) {
            var target = $('#link-to-cart > a');
            var targetOffset = target.offset();
            targetOffset.left += target.width() / 2;
            targetOffset.top += target.height() / 2;

            var image = $('#' + this.container)
                .find('.book-info[data-isbn="' + isbn + '"]')
                .find('.image > img');
            var startingOffset = image.offset();
            var helper = image.clone()
                .css('position', 'absolute')
                .css('z-index', 999)
                .css('top', startingOffset.top)
                .css('left', startingOffset.left)
                .appendTo('body');
            var animationProperties = {
                top: targetOffset.top,
                left: targetOffset.left,
                width: 0,
                height: 0,
                opacity: 0
            };
            
            helper.animate(animationProperties, 1000)
                .promise()
                .done(function() {
                    $(this).remove();
                });
        }

        return {
            showBoughtTip: showBoughtTip
        };
    }
);