const isLocal =
window.location.hostname === "localhost" ||
window.location.hostname === "127.0.0.1";

const API_BASE = isLocal
? "http://localhost:5000/api"
: "https://movie-ai-backend-ql2a.onrender.com";