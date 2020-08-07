// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportCrawler from '../../../app/controller/crawler';
import ExportHome from '../../../app/controller/home';
import ExportPuppeteer from '../../../app/controller/puppeteer';

declare module 'egg' {
  interface IController {
    crawler: ExportCrawler;
    home: ExportHome;
    puppeteer: ExportPuppeteer;
  }
}
