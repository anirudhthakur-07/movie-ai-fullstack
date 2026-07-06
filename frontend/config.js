const isLocal =
window.location.hostname === "localhost" ||
window.location.hostname === "127.0.0.1" ||
window.location.protocol === "file:";

const API_BASE = isLocal
? "http://localhost:5000/api"
: "https://movie-ai-backend-ql2a.onrender.com/api";