import { Controller } from 'egg';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer-core');

export default class PuppeteerController extends Controller {
  public async index() {
    const { ctx } = this;

    (async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage({
        headless: false,
      });
      await page.goto('https://learn.kaikeba.com/home');
      // await page.screenshot({ path: 'example.png' });

      await browser.close();
    })();

    ctx.body = 'aaa';
  }
}
