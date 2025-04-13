import cheerio from 'cheerio';

export default async function handler(req, res) {
  // URL of the Delaware River Club blog to scrape
  const url = "https://thedelawareriverclub.com/blog/";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url} (status: ${response.status})`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Attempt to select the first article as the latest post
    const article = $('article').first();
    
    // Initialize variables
    let title = "";
    let date = "";
    let summary = "";
    let link = "";

    if (article.length) {
      // Try primary selectors commonly used in WordPress themes
      title = article.find('h2.entry-title a').text().trim();
      if (!title) {
        title = article.find('h2').first().text().trim();
      }
      
      date = article.find('time.entry-date').attr('datetime') || article.find('time').first().text().trim();

      // Try extracting a summary from elements that might contain it
      summary = article.find('.entry-summary').text().trim();
      if (!summary) {
        summary = article.find('.entry-content p').first().text().trim();
      }
      // If the summary is very long, shorten it
      if (summary && summary.length > 300) {
        summary = summary.substring(0, 300) + '...';
      }
      
      link = article.find('h2.entry-title a').attr('href');
      if (!link) {
        link = article.find('a').first().attr('href');
      }
    }
    
    // If we couldn't extract a title, assume the scrape failed and provide a fallback.
    if (!title) {
      return res.status(200).json([{
        source: "Delaware River Club",
        title: "Visit Delaware River Club Blog",
        date: new Date().toISOString(),
        summary: "🐟 Click here to see the latest fishing report.",
        link: url
      }]);
    }

    // Ensure the summary includes a fish emoji for a visual cue.
    if (summary && !summary.includes("🐟")) {
      summary = "🐟 " + summary;
    } else if (!summary) {
      summary = "🐟 Click here to read the full report.";
    }

    const report = {
      source: "Delaware River Club",
      title,
      date: date || new Date().toISOString(),
      summary,
      link
    };

    res.status(200).json([report]);
  } catch (error) {
    console.error("Error scraping Delaware River Club blog:", error);
    // On error, return a fallback report with a fish icon and a link
    res.status(200).json([{
      source: "Delaware River Club",
      title: "Visit Delaware River Club Blog",
      date: new Date().toISOString(),
      summary: "🐟 Click here to see the latest fishing report.",
      link: url
    }]);
  }
}
