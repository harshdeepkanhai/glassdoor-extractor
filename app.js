const puppeteer = require('puppeteer');
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
let urls = [];
let pages = [];

fs.createReadStream('urls.csv')
  .pipe(csv({ separator: ';' }))
  .on('data', data => {
    urls.push(data);
  })
  .on('end', async () => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto('https://www.glassdoor.co.uk/profile/login_input.htm');
      pages = urls.map(url => url['pages']);
      urls = urls.map(url => url['urls']);
      await page.type('#userEmail', 'marcuslandy84@gmail.com');
      await page.type('#userPassword', 'marcuslandy84');

      await page.click(
        '#InlineLoginModule > div > div > div:nth-child(1) > div:nth-child(5) > form > div.mt-std.d-flex.flex-column > div:nth-child(1) > button'
      );
      setTimeout(async () => {
        try {
          await page.goto('https://www.glassdoor.co.uk');
          for (let i = 0; i < urls.length; i++) {
            console.log('///////////////////////');
            console.log(urls[i]);
            console.log('///////////////////////');
            const THE_PAGE = urls[i];
            const OFFSET = 0;
            const PAGES = pages[i];
            let filename = urls[i].match(/Interview\/(\S+)-Interview/)[1];
            const csvWriter = createCsvWriter({
              path: `${filename}.csv`,
              header: [
                { id: 'question', title: 'Question' },
                { id: 'answer', title: 'Answer' },
                { id: 'upvote', title: 'Upvote' }
              ],
              fieldDelimiter: ';'
            });
            const __pages = [];

            for (let i = OFFSET; i <= PAGES; i++) {
              if (i == 0) {
                __pages.push(THE_PAGE);
              } else if (i > 1) {
                let p = '_IP' + i + '.htm';
                __pages.push(THE_PAGE.replace(/\.htm$/, p));
              }
            }
            let allquestions = [];
            for (let i = 0; i < __pages.length; i++) {
              await page.goto(__pages[i]);

              let questions = await page.evaluate(() => {
                return Array.from(
                  document.querySelectorAll('.interviewQuestion')
                ).map(d =>
                  d.innerText.match(/^(.*)[\.|\?|\s]{1}(.*)/)[1].trim()
                );
              });
              let answers = await page.evaluate(() => {
                return Array.from(
                  document.querySelectorAll('.interviewQuestion a')
                ).map(d => d.href);
              });
              let upvotes = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.count span')).map(
                  d => d.innerText
                );
              });
              for (let i = 0; i < questions.length; i++) {
                allquestions.push({
                  question: questions[i],
                  answer: answers[i],
                  upvote: upvotes[i]
                });
              }
            }
            csvWriter
              .writeRecords(allquestions)
              .then(() => console.log('The CSV file was written successfully'));
          }

          await browser.close();
        } catch (err) {
          console.log(err);
        }
      }, 3000);
    } catch (err) {
      console.log(err);
    }
  });
