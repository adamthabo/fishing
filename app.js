// Mapping of USGS site codes to location name and NOAA forecast zone
const locationMapping = {
  "01425000": { name: "Stilesville, NY", noaa: "NYZ057" },
  "01426500": { name: "Hale Eddy, NY", noaa: "NYZ057" },
  "01427000": { name: "Hancock, NY", noaa: "NYZ057" },
  "01417000": { name: "Downsville, NY", noaa: "NYZ057" },
  "01417500": { name: "Harvard, NY", noaa: "NYZ057" },
  "01421000": { name: "Fishs Eddy, NY", noaa: "NYZ057" },
  "01420500": { name: "Cooks Falls, NY", noaa: "NYZ057" },
  "01419500": { name: "Livingston Manor, NY", noaa: "NYZ062" },
  "01436690": { name: "Bridgeville, NY", noaa: "NYZ062" },
  "01427207": { name: "Lordville, NY", noaa: "PAZ040" },
  "01427510": { name: "Callicoon, NY", noaa: "PAZ072" },
  "01428500": { name: "Barryville, NY", noaa: "NYZ062" },
  "01438500": { name: "Montague, NJ", noaa: "PAZ048" }
};

// Fetch real-time river data from USGS for the selected site
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

    checkFishingConditions(flow, temp);
  } catch (error) {
    console.error("Error fetching river data:", error);
  }
}

// Fetch weather forecast from NOAA using the zone endpoint based on the location mapping
async function fetchWeather(siteCode) {
  const locationData = locationMapping[siteCode];
  if (!locationData) return;
  
  const noaaZone = locationData.noaa;
  const weatherUrl = `https://api.weather.gov/zones/forecast/${noaaZone}`;
  try {
    const res = await fetch(weatherUrl);
    const data = await res.json();
    // NOAA Zone Forecast returns a properties.periods array
    const period = data.properties.periods[0];
    if (period) {
      document.getElementById("weather").textContent = `${period.shortForecast}, ${period.temperature}°${period.temperatureUnit}`;
      // Use the provided icon URL from the forecast if available
      if (period.icon) {
        document.getElementById("weather-icon").src = period.icon;
      }
    } else {
      document.getElementById("weather").textContent = "No forecast available";
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    document.getElementById("weather").textContent = "Error fetching weather";
  }
}

// Check if river conditions and temperature are ideal for fishing
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

// Update both river data and weather forecast based on the selected site
function updateData(siteCode) {
  fetchRiverData(siteCode);
  fetchWeather(siteCode);
}

// When the dropdown selection changes
document.getElementById("locationSelect").addEventListener("change", (e) => {
  updateData(e.target.value);
});

// Load default data on page load
updateData(document.getElementById("locationSelect").value);

// Refresh data every 15 minutes
setInterval(() => {
  updateData(document.getElementById("locationSelect").value);
}, 900000);
