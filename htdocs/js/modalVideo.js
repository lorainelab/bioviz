// Render menu bar
$(window).on("load", () => {

    $('#html5Video').on('hidden.bs.modal', function() {
        var html5Video = document.getElementById("htmlVideo");
        if (html5Video != null) {
            html5Video.pause();
        }
    });

});
