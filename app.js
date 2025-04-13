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

// ---------------------
// River & Weather Data
// ---------------------

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

    // Get geographic coordinates from USGS data for weather lookup
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

// Fetch weather forecast from NOAA using lat/lon coordinates
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

// ------------------------
// Fishing Reports (RSS)
// ------------------------

// Uses AllOrigins proxy to bypass CORS restrictions when fetching RSS feeds.
// (Ensure that the proxy service remains available or update with a reliable alternative.)
async function fetchRSSFeed(url) {
  const proxyUrl = "https://api.allorigins.hexocode.repl.co/get?disableCache=true&url=" + encodeURIComponent(url);
  const response = await fetch(proxyUrl);
  const data = await response.json();
  return data.contents;
}

// Parse RSS feed XML and return an array of report objects
function parseRSS(xmlString, sourceName) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  const items = xmlDoc.querySelectorAll("item");
  const reports = [];
  items.forEach(item => {
    const titleEl = item.querySelector("title");
    const linkEl = item.querySelector("link");
    const pubDateEl = item.querySelector("pubDate");
    const title = titleEl ? titleEl.textContent : "No title";
    const link = linkEl ? linkEl.textContent : "#";
    const pubDate = pubDateEl ? new Date(pubDateEl.textContent) : new Date();
    reports.push({ title, link, pubDate, source: sourceName });
  });
  return reports;
}

// Fetch fishing reports from local sources and update the DOM
async function updateFishingReports() {
  // Real RSS feed endpoints from local sources.
  // (These URLs are assumed to be valid. If unavailable, remove the feed or update the URL.)
  const rssFeeds = [
    { url: "https://www.eastbranchangler.com/reports/rss", source: "East Branch Angler" },
    { url: "https://www.beaverkilloutfitters.com/fishing-reports/rss.xml", source: "Beaver Kill Outfitters" }
  ];
  let allReports = [];
  for (const feed of rssFeeds) {
    try {
      const xmlString = await fetchRSSFeed(feed.url);
      const reports = parseRSS(xmlString, feed.source);
      allReports = allReports.concat(reports);
    } catch (error) {
      console.error(`Error fetching ${feed.source} reports:`, error);
    }
  }
  // Sort reports by publication date (most recent first)
  allReports.sort((a, b) => b.pubDate - a.pubDate);
  // Display the 5 most recent reports
  const reportList = document.getElementById("fishing-reports");
  reportList.innerHTML = "";
  if (allReports.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No fishing reports available.";
    reportList.appendChild(li);
  } else {
    allReports.slice(0, 5).forEach(report => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = report.link;
      a.target = "_blank";
      a.textContent = `[${report.source}] ${report.title} (${report.pubDate.toLocaleDateString()})`;
      li.appendChild(a);
      reportList.appendChild(li);
    });
  }
}

// ----------------------
// Update All & Scheduling
// ----------------------

// Update river, weather, and fishing reports
function updateAllData() {
  const siteCode = document.getElementById("locationSelect").value;
  fetchRiverData(siteCode);
  updateFishingReports();
}

// Event listener for the UPDATE ALL button
document.getElementById("updateAllBtn").addEventListener("click", updateAllData);

// Initial load: update data for the selected location
updateAllData();

// Also refresh data every 15 minutes
setInterval(updateAllData, 900000);

// Schedule an update every morning at 8 AM local time
function scheduleDailyUpdate() {
  const now = new Date();
  const next8am = new Date();
  next8am.setHours(8, 0, 0, 0);
  if (now >= next8am) {
    next8am.setDate(next8am.getDate() + 1);
  }
  const msUntil8am = next8am - now;
  setTimeout(function() {
    updateAllData();
    // Then update every 24 hours
    setInterval(updateAllData, 24 * 60 * 60 * 1000);
  }, msUntil8am);
}
scheduleDailyUpdate();
