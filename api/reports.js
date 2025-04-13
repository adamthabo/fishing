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

    // Attempt to find the latest post using multiple selectors.
    let article = $('article').first();
    if (!article.length) {
      article = $('.post').first();
    }
    
    let title = "";
    let date = "";
    let summary = "";
    let link = "";
    
    if (article.length) {
      title = article.find('.entry-title a').text().trim();
      if (!title) {
        title = article.find('h2 a').text().trim();
      }
      
      date = article.find('time').attr('datetime') || article.find('time').first().text().trim();
      
      summary = article.find('.entry-summary').text().trim();
      if (!summary) {
        summary = article.find('.entry-content p').first().text().trim();
      }
      if (summary && summary.length > 300) {
        summary = summary.substring(0, 300) + '...';
      }
      
      link = article.find('.entry-title a').attr('href');
      if (!link) {
        link = article.find('a').first().attr('href');
      }
    }
    
    // If we couldn't extract a title, use a fallback report.
    if (!title) {
      return res.status(200).json([{
        source: "Delaware River Club",
        title: "Visit Delaware River Club Blog",
        date: new Date().toISOString(),
        summary: "🐟 Click here to read the latest fishing report.",
        link: url
      }]);
    }
    
    // Prepend a fish emoji to the summary if it isn’t already present.
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
    // On error, return a fallback report.
    res.status(200).json([{
      source: "Delaware River Club",
      title: "Visit Delaware River Club Blog",
      date: new Date().toISOString(),
      summary: "🐟 Click here to read the latest fishing report.",
      link: url
    }]);
  }
}
