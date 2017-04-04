$(window).load(function () {

    $('#TopMenu').load('menu.html?v=12392829', function () {
        highlightCurrentPage();
    });

    $('#footer').load('footer.html?v=12392829');

});

function highlightCurrentPage() {
    var currentPage = window.location.pathname.substr(5);
    $('a[href="' + currentPage + '"]').parent('li').addClass('active');
}