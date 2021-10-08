const BACKEND_DOMAIN = "http://127.0.0.1:8000";

export function convertURL(url) {
  return BACKEND_DOMAIN.includes("http")
    ? `${BACKEND_DOMAIN}/rest_api/?hubUrl=${url}&fileName=/`
    : `https://${BACKEND_DOMAIN}/rest_api/?hubUrl=${url}&fileName=/`;
}

// Close tooltips on outside click
export function handleTooltips() {
  $("body").click((e) => {
    const elementClicked = $(e.target);
    if (
      !elementClicked.hasClass("info") &&
      !elementClicked.hasClass("tooltip-inner")
    ) {
      $(".info").each((ind, el) => {
        $(el).tooltip("hide");
      });
    }
  });
}
