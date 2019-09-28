const puppeteer = require('puppeteer');
const csv = require('csv-parser');
const fs = require('fs');
const mysql = require('mysql');
let urls = [];

const connection = mysql.createConnection({
  host: 'y5s2h87f6ur56vae.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  user: 'cpdykru3b0yv2m0f',
  password: 'ycyrli3rcm53r6zz',
  database: 'z9z7i3kjsn5aq5z8'
});

connection.connect(err => {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

fs.createReadStream('OYO-Software-Developer.csv')
  .pipe(csv({ separator: ';' }))
  .on('data', data => {
    urls.push(data);
  })
  .on('end', async () => {
    try {
      let company = 'OYO';
      let role = 'Software Developer';
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto('https://www.glassdoor.co.in/profile/login_input.htm');
      await page.type('#userEmail', 'tyrolbenson@gmail.com');
      await page.type('#userPassword', 'tyrolbenson');

      await page.click(
        '#InlineLoginModule > div > div > div:nth-child(1) > div:nth-child(5) > form > div.mt-std.d-flex.flex-column > div:nth-child(1) > button'
      );
      await page.waitForSelector('.signed-in');
      urls = urls.sort((a, b) => b.Upvote - a.Upvote).slice(0, 2);
      for (let i = 0; i < urls.length; i++) {
        await page.goto(urls[i]['Answer']);
        await page.screenshot({ path: `screenshot-${i}.png` });
        await page.waitForSelector('textarea[name=responseText]');
        let answer = `I think the key in generic questions like this is to be careful to cover the fundamentals, 
        and to be familiar with all the followups so you're prepared for whatever they throw at you. 
        Maybe do a mock interview with a ${company} ${role} expert on PrepTick to get a real-world answer? 
        They give lots of guidance and pro tips on how to deal with this kind of stuff. https://www.preptick.com/practice-interviews-swe`;
        await page.type('textarea[name=responseText]', answer);
        await page.evaluate(() => {
          document.querySelector('button.fillHH').click();
        });
        connection.beginTransaction(err => {
          if (err) {
            throw err;
          }
          let UTC_TIMESTAMP = {
            toSqlString: function() {
              return 'UTC_TIMESTAMP()';
            }
          };
          let sql = mysql.format(
            'INSERT INTO glassdoor_demand SET company = ?, role = ?, question_url = ?, answer = ?, posted_at = ?',
            [company, role, urls[i]['Answer'], answer, UTC_TIMESTAMP]
          );
          connection.query(sql, (error, results, fields) => {
            if (error) {
              return connection.rollback(function() {
                throw error;
              });
            }
            connection.commit(function(err) {
              if (err) {
                return connection.rollback(function() {
                  throw err;
                });
              }
              console.log('success!');
            });
          });
        });
      }

      await browser.close();
    } catch (err) {
      console.log(err);
    }
  });
