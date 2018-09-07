$(function () {
    var jSlides = $('#slides');
    if (jSlides.size() > 0) {
        jSlides.cycle({
            pager: '#slideshow-nav',
            pagerAnchorBuilder: function (idx, slide) {
                return '<li><a href="#"></a></li>';
            }
        });
    }
});

if (!Object.create) {
    Object.create = function(proto) {
        function F(){}
        F.prototype = proto;
        return new F;
    }
}