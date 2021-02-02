// Render menu bar
$(window).on("load", () => {

    var html5Video = document.getElementById("htmlVideo");

    // Load walkthrough video after the rest of the page loads.
    // - Allows menu bar to load without waiting for the slow mp4 request.
    html5Video.querySelector('source').src ='https://www.dropbox.com/s/isx033lv0cwmftl/bioVizConnectIntro.mp4?raw=1';
    html5Video.innerHTML = html5Video.innerHTML;

    $('#html5Video').on('hidden.bs.modal', function() {
        if (html5Video != null) {
            html5Video.pause();
        }
    });

});
