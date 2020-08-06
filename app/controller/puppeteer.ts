import { Controller } from 'egg';
import puppeteer = require('puppeteer-core');
import findChrome = require('carlo/lib/find_chrome.js');

export default class PuppeteerController extends Controller {
  public async index() {
    const { ctx } = this;
    ctx.body = '<button onclick="fetch(\'\/getMovies\')">开始执行</button>';
  }

  public async getMovies() {
    const findChromePath = await findChrome({});
    const executablePath = findChromePath.executablePath;

    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      devtools: false,
      // args: [''],
      executablePath,
    });
    const page = await browser.newPage();
    await page.goto('https://learn.kaikeba.com/home');
    await page.waitFor('div.others-item .item-text');
    await page.waitFor(2000);

    await page.screenshot({ path: './example.png' });

    const phoneBtn = await page.$('div.others-item .item-text');
    phoneBtn?.click();

    await page.waitFor(3000);

    await browser.close();

    this.ctx.body = '';
  }
}
