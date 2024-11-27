document.addEventListener("click", function (event) {
    const btnDownload = event.target.closest(".btn-ga-download");
    const btnEarlyAccessDownload = event.target.closest(".btn-ga-early-access-download");

    if (btnDownload && btnDownload.hasAttribute("os-name")) {
        const osName = btnDownload.getAttribute("os-name");
        let downloadPageTitle = "Download Button Clicked - " + osName;
        if (typeof gtag === "function") {
            gtag('event', 'page_view', {
                'page_title': downloadPageTitle,
                'page_path': window.location.pathname + "/" + downloadPageTitle
            });
        }
    }

    if (btnEarlyAccessDownload && btnEarlyAccessDownload.hasAttribute("os-name")) {
        const osName = btnEarlyAccessDownload.getAttribute("os-name");
        let earlyAccessDownloadPageTitle = "Early Access Download Button Clicked - " + osName;
        if (typeof gtag === "function") {
            gtag('event', 'page_view', {
                'page_title': earlyAccessDownloadPageTitle,
                'page_path': window.location.pathname + "/" + earlyAccessDownloadPageTitle
            });
        }
    }
});
