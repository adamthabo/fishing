import cheerio from 'cheerio';

export default async function handler(req, res) {
  // Array to store aggregated report objects
  const reports = [];
  
  // List of RSS feeds with their source names and feed URLs
  const feeds = [
    { source: "Delaware River Club", url: "https://thedelawareriverclub.com/feed/" },
    { source: "West Branch Resort", url: "https://www.westbranchresort.com/feed/" },
    { source: "Delaware River Fishing", url: "http://www.delawareriverfishing.com/feed/" },
    { source: "Destination Angler", url: "https://destinationangler.libsyn.com/rss" }
  ];

  // Process each feed
  for (let feed of feeds) {
    try {
      const response = await fetch(feed.url);
      if (!response.ok) {
        console.error(`Error fetching feed from ${feed.url}`);
        continue;
      }
      const xml = await response.text();
      // Load XML with Cheerio (use xmlMode for proper parsing)
      const $ = cheerio.load(xml, { xmlMode: true });
      
      // For simplicity, take the first <item> from the feed as the latest report
      const item = $('item').first();
      if (item.length) {
        const title = item.find('title').first().text().trim();
        const date = item.find('pubDate').first().text().trim();
        // Use the description element for a summary; if not available, fallback to an empty string
        const summary = item.find('description').first().text().trim() || "";
        const link = item.find('link').first().text().trim();
        
        if (title && link) {
          reports.push({
            source: feed.source,
            title,
            date,
            summary,
            link
          });
        }
      }
    } catch (error) {
      console.error("Error processing feed " + feed.url, error);
    }
  }
  
  res.status(200).json(reports);
}
