import cheerio from 'cheerio';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  const url = "https://thedelawareriverclub.com/blog/";
  let report = null;

  // First, try using Cheerio
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url} (status: ${response.status})`);
    const html = await response.text();
    let $ = cheerio.load(html);

    // Try to select the first article using multiple selectors
    let article = $('article').first();
    if (!article.length) {
      article = $('.post').first();
    }

    if (article.length) {
      let title = article.find('.entry-title a').text().trim() || article.find('h2 a').text().trim();
      let date = article.find('time').attr('datetime') || article.find('time').first().text().trim();
      let summary = article.find('.entry-summary').text().trim() || article.find('.entry-content p').first().text().trim();
      if (summary && summary.length > 300) {
        summary = summary.substring(0, 300) + '...';
      }
      let link = article.find('.entry-title a').attr('href') || article.find('a').first().attr('href');
      
      if (title && link) {
        // Prepend a fish emoji if not already present
        if (summary && !summary.includes("🐟")) {
          summary = "🐟 " + summary;
        } else if (!summary) {
          summary = "🐟 Click here to read the full report.";
        }
        report = {
          source: "Delaware River Club",
          title,
          date: date || new Date().toISOString(),
          summary,
          link
        };
      }
    }
  } catch (error) {
    console.error("Cheerio method failed:", error);
  }

  // If Cheerio did not produce a report, try using jsdom as a fallback
  if (!report) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url} (status: ${response.status})`);
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Try to select the first article using DOM selectors
      let article = document.querySelector('article') || document.querySelector('.post');
      if (article) {
        let titleEl = article.querySelector('.entry-title a') || article.querySelector('h2 a');
        let timeEl = article.querySelector('time');
        let summaryEl = article.querySelector('.entry-summary') || article.querySelector('.entry-content p');
        let linkEl = article.querySelector('.entry-title a') || article.querySelector('a');
        
        const title = titleEl ? titleEl.textContent.trim() : "";
        const date = timeEl ? (timeEl.getAttribute('datetime') || timeEl.textContent.trim()) : "";
        let summary = summaryEl ? summaryEl.textContent.trim() : "";
        if (summary && summary.length > 300) {
          summary = summary.substring(0, 300) + '...';
        }
        const link = linkEl ? linkEl.getAttribute('href') : "";
        
        if (title && link) {
          if (summary && !summary.includes("🐟")) {
            summary = "🐟 " + summary;
          } else if (!summary) {
            summary = "🐟 Click here to read the full report.";
          }
          report = {
            source: "Delaware River Club",
            title,
            date: date || new Date().toISOString(),
            summary,
            link
          };
        }
      }
    } catch (error) {
      console.error("jsdom fallback failed:", error);
    }
  }

  // Final fallback: if no report was scraped, return a default message
  if (!report) {
    report = {
      source: "Delaware River Club",
      title: "Visit Delaware River Club Blog",
      date: new Date().toISOString(),
      summary: "🐟 Click here to view the latest fishing report.",
      link: url
    };
  }

  res.status(200).json([report]);
}
