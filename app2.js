const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
let data = [];
let positions = [
  { company: 'Oyo', role: 'Software Developer' },
  { company: 'Oyo', role: 'Software Engineer' },
  { company: 'Oyo', role: 'Product Manager' }
];

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const csvWriter = createCsvWriter({
      path: `urls.csv`,
      header: [
        { id: 'urls', title: 'urls' },
        { id: 'pages', title: 'pages' },
        { id: 'company', title: 'company' },
        { id: 'role', title: 'role' }
      ],
      fieldDelimiter: ';'
    });
    for (let i = 0; i < positions.length; i++) {
      await page.goto('https://google.com');
      await page.waitForSelector('.gLFyf');
      await page.waitForSelector('.RNmpXc');
      await page.type(
        '.gLFyf',
        `${positions[i][company]} ${positions[i][role]} interview questions glassdoor`,
        { delay: 100 }
      );
      await page.evaluate(() => {
        document.querySelector('input[name=btnI]').click();
      });
      await page.waitForSelector('h1.h2');
      console.log(page.url());
      let url = await page.url();
      console.log(url);
      url = url.replace(/\.htm$/, '_IP2000.htm');
      console.log(url);
      await page.goto(url);
      await page.waitForSelector('span.disabled');
      const pageno = await page.evaluate(() => {
        return document.querySelector('span.disabled').innerText;
      });

      console.log(pageno);
      data.push({
        urls: url,
        pages: pageno,
        company: positions[i][company],
        role: positions[i][role]
      });
    }
    csvWriter
      .writeRecords(data)
      .then(() => console.log('The CSV file was written successfully'));
    await browser.close();
  } catch (err) {
    console.log(err);
  }
})();
