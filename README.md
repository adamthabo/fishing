# Upper Delaware Fishing Alert

A live resource that integrates USGS river data with NOAA weather forecasts and recent local fishing reports for key fly‑fishing locations in the Upper Delaware River system.

## Features
- **Live River Data:** Real‑time water data (flow, gauge height, water temperature) from USGS.
- **Live Weather Forecast:** NOAA forecast is fetched using geographic coordinates derived from USGS data.
- **Dynamic Fly Pattern Suggestions:** Recommended fly patterns based on the water temperature.
- **Recent Fishing Reports:** Aggregated, live data from local fishing report sources (e.g., The Delaware River Club, West Branch Resort, Delaware River Fishing).  
  > **Important:** You must implement a server‑side (or serverless) endpoint at `/api/reports` to scrape and return recent fishing reports in JSON format.
- **UPDATE ALL Button:** Manually refresh all data (river, weather, and fishing reports).
- **Scheduled Daily Update:** Automatically updates all data every morning at 8:00 AM local time.
- **Regular Refresh:** River and weather data are refreshed every 15 minutes.

## File Structure


