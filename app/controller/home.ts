import { Controller } from 'egg';
const Crawler = require('crawler');

const c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback(error, res, done) {
    if (error) {
      console.log(error);
    } else {
      const $ = res.$;
      // $ is Cheerio by default
      // a lean implementation of core jQuery designed specifically for the server
      console.log($('title').text());
    }
    done();
  },
});

export default class HomeController extends Controller {
  public async index() {
    const { ctx } = this;
    ctx.body = await ctx.service.test.sayHi('egg');
  }

  public async spider() {
    const { ctx } = this;

    c.queue({
      uri: 'https://learn.kaikeba.com/home',
      callback(error, res, done) {
        if (error) {
          console.log(error);
        } else {
          console.log('Grabbed', res.body, 'bytes');
        }
        done();
      },
    });

    ctx.body = 'aaa';
  }
}
