import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.home.index);
  router.get('/spider-c', controller.crawler.index);
  router.get('/spider-p', controller.puppeteer.index);
  router.get('/getMovies', controller.puppeteer.getMovies);
};
