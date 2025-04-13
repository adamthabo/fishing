import cheerio from 'cheerio';

export default async function handler(req, res) {
  // An array to store the report objects we extract
  const reports = [];
  
  // List of sources: each with a label and the URL to scrape.
  const sources = [
    { source: "Delaware River Club", url: "https://thedelawareriverclub.com/blog/" },
    { source: "West Branch Resort", url: "https://www.westbranchresort.com/delaware-fishing-report" },
    { source: "Delaware River Fishing", url: "http://www.delawareriverfishing.com" }
  ];

  // Loop over each source to fetch and scrape its latest report
  for (let site of sources) {
    try {
      const response = await fetch(site.url);
      if (!response.ok) {
        console.error(`Error fetching ${site.url}`);
        continue;
      }
      const html = await response.text();
      const $ = cheerio.load(html);
      let report = {};
      
      // --- Delaware River Club Scraping Logic ---
      if (site.source === "Delaware River Club") {
        // Look for the first <article> element (commonly used in blogs)
        const article = $('article').first();
        if (article.length) {
          const title = article.find('h2.entry-title a').text().trim();
          const date = article.find('time.entry-date').attr('datetime') || article.find('time').text().trim();
          const summary = article.find('.entry-content p').first().text().trim();
          const link = article.find('h2.entry-title a').attr('href');
          report = { source: site.source, title, date, summary, link };
        }
      }
      // --- West Branch Resort Scraping Logic ---
      else if (site.source === "West Branch Resort") {
        // Assume latest report is within an element with class 'post'
        const article = $('.post').first();
        if (article.length) {
          const title = article.find('.post-title a').text().trim();
          const date = article.find('.post-date').text().trim();
          const summary = article.find('.post-excerpt').text().trim();
          const link = article.find('.post-title a').attr('href');
          report = { source: site.source, title, date, summary, link };
        }
      }
      // --- Delaware River Fishing Scraping Logic ---
      else if (site.source === "Delaware River Fishing") {
        // Try to use an <article> element to get the latest report
        const article = $('article').first();
        if (article.length) {
          const title = article.find('h2').first().text().trim();
          const date = article.find('time').attr('datetime') || article.find('time').text().trim();
          const summary = article.find('p').first().text().trim();
          const link = article.find('a').first().attr('href');
          report = { source: site.source, title, date, summary, link };
        }
      }
      
      // If a valid report with a title was found, add it to our reports array.
      if (report && report.title) {
        reports.push(report);
      }
    } catch (error) {
      console.error("Error processing site " + site.url, error);
    }
  }
  
  res.status(200).json(reports);
}
