$('#TopMenu').load('menu.html?v=12392829')

function showSupportBannerWhenReady() {
    const checkExist = setInterval(() => {
      const banner = document.getElementById('support-banner');
      const body = document.body;
      const currentPage = window.location.pathname.split('/').pop();

      if (currentPage === 'support.html') {
        if (banner) banner.style.display = 'none';
        clearInterval(checkExist);
        return;
      }


      if (banner && !body.classList.contains('support-visible')) {
        banner.style.display = 'block';
        body.classList.add('support-visible');
        clearInterval(checkExist);
      }
    }, 500); 
  }