/* Apply the saved theme before first paint so there is no flash (external file: the CSP blocks inline scripts). */
try { var t = localStorage.getItem("gs-theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); } catch (e) {}
