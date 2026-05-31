
// ANALYTICS DASHBOARD
// Visualizes User Streaming Activity & Preferences
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// LOAD OVERVIEW ANALYTICS
async function loadAnalytics() {

    try {

        const res = await fetch(`${API_BASE}/analytics/overview?t=` + Date.now(), {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const data = await res.json();

        document.getElementById("totalClicks").innerText =
            data.totalClicks || 0;

       document.getElementById("topProvider").innerText =
    data.topProvider || "No Data";

document.getElementById("topGenre").innerText =
    data.topGenre || "No Data";

    } catch (err) {

        console.error("Overview analytics failed", err);
    }
}

// AUTHENTICATION VERIFICATION
// Redirect Unauthorized Users To Login Page
async function loadProviderChart() {
    try {
        const res = await fetch(`${API_BASE}/analytics/providers?t=` + Date.now(), {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const data = await res.json();
        console.log("PROVIDER API:", data);
        const ctx = document.getElementById("providerChart");

        // EMPTY STATE
        if (!data || Object.keys(data).length === 0){
            ctx.style.display = "none";
            ctx.parentElement.insertAdjacentHTML(
                "beforeend",
                `
                <div class="empty-chart">
                    <h3>No Streaming Activity Yet</h3>
                    <p>Explore movies and open streaming platforms to build your universe.</p>
                </div>
                `
            );
            return;
        }

        const formattedLabels = Object.keys(data).map(word => 
            word.replace(/\b\w/g, letter => letter.toUpperCase())
        );

        // CREATE CHART
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: formattedLabels, 
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        "#ff4d6d",
                        "#4cc9f0",
                        "#f72585",
                        "#fca311",
                        "#2ec4b6",
                        "#7209b7",
                        "#90be6d"
                    ],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "white",
                            padding: 18,
                            usePointStyle: true,
                            pointStyle: "circle",
                            font: {
                                size: 13
                            }
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Provider chart failed", err);
    }
}
// GENRE ANALYTICS
// Generate User Genre Preference Bar Chart
async function loadGenreChart() {
    try {
        const res = await fetch(`${API_BASE}/analytics/genres?t=` + Date.now(), {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const data = await res.json();
        console.log("GENRE API:", data);
        const ctx = document.getElementById("genreChart");

        // Display placeholder when analytics data is unavailable
        if (!data || Object.keys(data).length === 0){
            ctx.style.display = "none";
            ctx.parentElement.insertAdjacentHTML(
                "beforeend",
                `
                <div class="empty-chart">
                    <h3>No Movie Personality Yet</h3>
                    <p>Your genre personality chart will appear after exploring movies.</p>
                </div>
                `
            );
            return;
        }

        const formattedLabels = Object.keys(data).map(word => 
            word.replace(/\b\w/g, letter => letter.toUpperCase())
        );

      // Render provider distribution chart
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: formattedLabels, 
                datasets: [{
                    label: "Genre Activity",
                    data: Object.values(data),
                    backgroundColor: [
                        "#ff4d6d",
                        "#4cc9f0",
                        "#f72585",
                        "#7209b7",
                        "#fca311",
                        "#2ec4b6",
                        "#90be6d",
                        "#e76f51"
                    ],
                    borderRadius: 10,
                    barThickness: 45
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "white",
                            stepSize: 1
                        },
                        grid: {
                            color: "rgba(255,255,255,0.05)"
                        },
                        border: {
                            display: false
                        }
                    },
                    x: {
                        ticks: {
                            color: "white"
                        },
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Genre chart failed", err);
    }
}

// START DASHBOARD
loadAnalytics();
loadProviderChart();
loadGenreChart();

