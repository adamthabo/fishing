import cheerio from 'cheerio';

export default async function handler(req, res) {
  // URL of the Delaware River Club blog to scrape
  const url = "https://thedelawareriverclub.com/blog/";
  try {
    // Fetch the HTML content from the blog page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url} (status: ${response.status})`);
    }
    const html = await response.text();
    
    // Load the HTML into Cheerio for parsing
    const $ = cheerio.load(html);
    
    // Find the first <article> element on the page (assumes the latest post is first)
    const article = $('article').first();
    
    if (article.length) {
      // Extract key pieces of information from the article
      const title = article.find('h2.entry-title a').text().trim();
      const date = article.find('time.entry-date').attr('datetime') || article.find('time').text().trim();
      const summary = article.find('.entry-content p').first().text().trim();
      const link = article.find('h2.entry-title a').attr('href');

      // Build a report object
      const report = {
        source: "Delaware River Club",
        title,
        date,
        summary,
        link
      };

      // Return the report in an array (so your front-end code doesn't need to change)
      res.status(200).json([report]);
    } else {
      res.status(200).json([{ message: "No report found" }]);
    }
  } catch (error) {
    console.error("Error scraping Delaware River Club blog:", error);
    res.status(500).json({ error: error.toString() });
  }
}
