import cheerio from 'cheerio';

export default async function handler(req, res) {
  // Array to store the report objects
  const reports = [];
  
  // List of sources with labels and URLs to scrape
  const sources = [
    { source: "Delaware River Club", url: "https://thedelawareriverclub.com/blog/" },
    { source: "West Branch Resort", url: "https://www.westbranchresort.com/delaware-fishing-report" },
    { source: "Delaware River Fishing", url: "http://www.delawareriverfishing.com" }
  ];

  // Loop over each source
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
      
      // Scraping logic for each source
      
      // Delaware River Club
      if (site.source === "Delaware River Club") {
        const article = $('article').first();
        if (article.length) {
          const title = article.find('h2.entry-title a').text().trim();
          const date = article.find('time.entry-date').attr('datetime') || article.find('time').text().trim();
          const summary = article.find('.entry-content p').first().text().trim();
          const link = article.find('h2.entry-title a').attr('href');
          report = { source: site.source, title, date, summary, link };
        }
      }
      // West Branch Resort
      else if (site.source === "West Branch Resort") {
        const article = $('.post').first();
        if (article.length) {
          const title = article.find('.post-title a').text().trim();
          const date = article.find('.post-date').text().trim();
          const summary = article.find('.post-excerpt').text().trim();
          const link = article.find('.post-title a').attr('href');
          report = { source: site.source, title, date, summary, link };
        }
      }
      // Delaware River Fishing
      else if (site.source === "Delaware River Fishing") {
        const article = $('article').first();
        if (article.length) {
          const title = article.find('h2').first().text().trim();
          const date = article.find('time').attr('datetime') || article.find('time').text().trim();
          const summary = article.find('p').first().text().trim();
          const link = article.find('a').first().attr('href');
          report = { source: site.source, title, date, summary, link };
        }
      }
      
      // Add the report if it has a title
      if (report && report.title) {
        reports.push(report);
      }
    } catch (error) {
      console.error("Error processing site " + site.url, error);
    }
  }
  
  res.status(200).json(reports);
}
