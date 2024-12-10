function sendPageViewEvent() {
    // Select the visibleDivs with ga-page-title that is not hidden by d-none class
    const visibleDivs = document.querySelectorAll('div[ga-page-title]:not(.d-none)');

    // When the error divs are visible, the igb running or not running div are also made visible but the main div encapsulating them is hidden,
    // so we have to check for that and send an event for only the error div
    if (visibleDivs.length === 2) {
        visibleDivs.forEach(visibleDiv => {
            if(visibleDiv.getAttribute('ga-page-title') !== "Galaxy bridge - IGB running"
               && visibleDiv.getAttribute('ga-page-title') !== "Galaxy bridge - IGB not running"){
                // Get the page title from the visibleDivs's ga-page-title attribute
                const pageTitle = visibleDiv.getAttribute('ga-page-title');
                sendToAnalytics(pageTitle);
            }
        })
    }
    else if (visibleDivs.length === 1) {
        // Get the page title from the visibleDivs's ga-page-title attribute
        const pageTitle = visibleDivs[0].getAttribute('ga-page-title');
        sendToAnalytics(pageTitle);
    }
}

function sendToAnalytics(pageTitle) {
    if (pageTitle) {
        if (typeof gtag === "function") {
            gtag("event", "page_view", {
                page_title: pageTitle,
                page_path: window.location.pathname + "/" + pageTitle
            });
        } else {
            console.warn("Google Analytics is not initialized.");
        }
    }
}

setTimeout(sendPageViewEvent, 500); // To wait till the correct div is loaded
