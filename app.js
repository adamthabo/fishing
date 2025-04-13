// Mapping of USGS site codes to location names (for reference)
const locationMapping = {
  "01425000": "Stilesville, NY",
  "01426500": "Hale Eddy, NY",
  "01427000": "Hancock, NY",
  "01417000": "Downsville, NY",
  "01417500": "Harvard, NY",
  "01421000": "Fishs Eddy, NY",
  "01420500": "Cooks Falls, NY",
  "01419500": "Livingston Manor, NY",
  "01436690": "Bridgeville, NY",
  "01427207": "Lordville, NY",
  "01427510": "Callicoon, NY",
  "01428500": "Barryville, NY",
  "01438500": "Montague, NJ"
};

// Fetch real-time river data from USGS
async function fetchRiverData(siteCode) {
  const usgsUrl = `https://waterservices.usgs.gov/nwis/iv/?sites=${siteCode}&format=json&parameterCd=00060,00065,00010`;
  try {
    const res = await fetch(usgsUrl);
    const data = await res.json();
    const series = data.value.timeSeries;

    let flow = "--", level = "--", temp = "--";
    series.forEach(s => {
      const code = s.variable.variableCode[0].value;
      const val = s.values[0].value[0]?.value || "--";
      if (code === "00060") flow = `${val} cfs`;
      if (code === "00065") level = `${val} ft`;
      if (code === "00010") temp = `${val}°C`;
    });

    document.getElementById("flow").textContent = "Flow: " + flow;
    document.getElementById("level").textContent = "Level: " + level;
    document.getElementById("temp").textContent = "Temperature: " + temp;

    // Use coordinates from USGS data to fetch weather forecast via NOAA
    if (series.length > 0 && series[0].sourceInfo && series[0].sourceInfo.geoLocation) {
      const lat = series[0].sourceInfo.geoLocation.geogLocation.latitude;
      const lon = series[0].sourceInfo.geoLocation.geogLocation.longitude;
      fetchWeatherCoordinates(lat, lon);
    } else {
      document.getElementById("weather").textContent = "Coordinates unavailable for weather";
    }

    checkFishingConditions(flow, temp);
  } catch (error) {
    console.error("Error fetching river data:", error);
  }
}

// Fetch weather forecast from NOAA using latitude and longitude
async function fetchWeatherCoordinates(lat, lon) {
  const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
  try {
    const resPoints = await fetch(pointsUrl);
    const pointsData = await resPoints.json();
    const forecastUrl = pointsData.properties.forecast;
    const resForecast = await fetch(forecastUrl);
    const forecastData = await resForecast.json();
    const period = forecastData.properties.periods[0];
    if (period) {
      document.getElementById("weather").textContent = `${period.shortForecast}, ${period.temperature}°${period.temperatureUnit}`;
    } else {
      document.getElementById("weather").textContent = "No forecast available";
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    document.getElementById("weather").textContent = "Error fetching weather";
  }
}

// Determine if river conditions are ideal for fishing
function checkFishingConditions(flowStr, tempStr) {
  const flow = parseFloat(flowStr);
  const temp = parseFloat(tempStr);
  const alertEl = document.getElementById("alerts");
  // Ideal thresholds: flow between 500-2000 cfs and temperature between 8°C-18°C
  if (!isNaN(flow) && !isNaN(temp) && flow >= 500 && flow <= 2000 && temp >= 8 && temp <= 18) {
    alertEl.textContent = "🔥 Conditions are PERFECT for fishing!";
  } else {
    alertEl.textContent = "⚠️ Conditions are suboptimal.";
  }
  suggestFlyPatterns(temp);
}

// Suggest fly patterns based on water temperature
function suggestFlyPatterns(temp) {
  const flies = [];
  if (temp <= 10) flies.push("Blue Wing Olive", "Little Black Stonefly");
  else if (temp <= 16) flies.push("Hendrickson", "Parachute Adams");
  else flies.push("Sulphur Dun", "Elk Hair Caddis");

  const ul = document.getElementById("flies");
  ul.innerHTML = "";
  flies.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f;
    ul.appendChild(li);
  });
}

// Fetch fishing reports from the server-side endpoint
async function fetchFishingReports() {
  try {
    const res = await fetch("/api/reports");
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    const reportsList = document.getElementById("reports-list");
    reportsList.innerHTML = "";
    data.forEach(report => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${report.source}</strong>: <a href="${report.link}" target="_blank">${report.title}</a> (${report.date})<br><em>${report.summary}</em>`;
      reportsList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching fishing reports:", error);
    document.getElementById("reports-list").innerHTML = "<li>Error fetching fishing reports</li>";
  }
}

// Update river data, weather forecast, and fishing reports
function updateAll() {
  const siteCode = document.getElementById("locationSelect").value;
  fetchRiverData(siteCode);
  fetchFishingReports();
}

// When the drop-down selection changes, update immediately (for USGS/NOAA)
document.getElementById("locationSelect").addEventListener("change", () => {
  updateAll();
});

// Manual UPDATE ALL button (orange) for on-demand refresh of all data
document.getElementById("update-all").addEventListener("click", () => {
  updateAll();
});

// Auto-update river/weather every 15 minutes
setInterval(() => {
  const siteCode = document.getElementById("locationSelect").value;
  fetchRiverData(siteCode);
}, 900000);

// Schedule a daily update at 8:00 AM (local time)
function scheduleDailyUpdate() {
  const now = new Date();
  const nextUpdate = new Date();
  nextUpdate.setHours(8, 0, 0, 0);
  if (now > nextUpdate) {
    nextUpdate.setDate(nextUpdate.getDate() + 1);
  }
  const msUntilUpdate = nextUpdate - now;
  setTimeout(() => {
    updateAll();
    // Then update every 24 hours
    setInterval(updateAll, 24 * 60 * 60 * 1000);
  }, msUntilUpdate);
}

updateAll();
scheduleDailyUpdate();
