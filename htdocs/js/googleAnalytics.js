(function loadGA4() {
  // Create a script element for gtag.js
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XEM1HMKGD4';

  // Insert the script into the HTML head
  document.head.appendChild(script);

  // Initialize the dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  // Set up Google Analytics with the given tracking ID
  gtag('js', new Date());
  gtag('config', 'G-XEM1HMKGD4');
})();
