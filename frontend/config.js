const isLocal =
window.location.hostname === "localhost" ||
window.location.hostname === "127.0.0.1";

const API_BASE = isLocal
? "http://localhost:5000/api"
: "https://YOUR_RENDER_URL.onrender.com/api";