const siteLookup = {
  "01427207": "Lordville, NY",
  "01427510": "Callicoon, NY",
  "01426500": "Hale Eddy, NY",
  "01421000": "Cooks Falls, NY",
  "01420500": "Livingston Manor, NY",
  "01434498": "Claryville, NY"
};

async function fetchRiverData(siteCode) {
  const url = `https://waterservices.usgs.gov/nwis/iv/?sites=${siteCode}&format=json&parameterCd=00060,00065,00010`;
  const res = await fetch(url);
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
}

function checkFishingConditions(flowStr, tempStr) {
  const flow = parseFloat(flowStr);
  const temp = parseFloat(tempStr);
  const alert = document.getElementById("alerts");
  if (!isNaN(flow) && !isNaN(temp) && flow >= 500 && flow <= 2000 && temp >= 8 && temp <= 18) {
    alert.textContent = "🔥 Conditions are PERFECT for fishing!";
  } else {
    alert.textContent = "⚠️ Conditions are suboptimal.";
  }

  suggestFlyPatterns(temp);
}

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

document.getElementById("locationSelect").addEventListener("change", (e) => {
  fetchRiverData(e.target.value);
});

// Load default
fetchRiverData(document.getElementById("locationSelect").value);
