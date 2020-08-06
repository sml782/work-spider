/* eslint-disable @typescript-eslint/no-var-requires */
const puppeteer = require('puppeteer-core');
const findChrome = require('carlo/lib/find_chrome.js');
const inquirer = require('inquirer');
const chalk = require('chalk');
const url = require('url');

async function mobileLogin(page) {
  const phoneBtn = await page.$('div.others-item .item-text');
  phoneBtn.click();

  // 用户输入手机号
  const mobilePromps = [{
    type: 'input',
    name: 'mobile',
    message: '请输入手机号',
    validate(input) {
      if (!input) {
        return '手机号不能为空';
      }
      return true;
    },
  }];
  const mobileAns = await inquirer.prompt(mobilePromps);
  await page.type('#pass > div > div > div.login-area > div.mobile-form > div:nth-child(2) > input', mobileAns.mobile);

  await page.waitFor(1000);

  // 发送验证码
  const verifyBtn = await page.$('#pass > div > div > div.login-area > div.mobile-form > div:nth-child(4) > div > button');
  verifyBtn.click();

  await page.waitFor(1000);

  // 用户输入验证码
  const verifyPromps = [{
    type: 'input',
    name: 'verifyCode',
    message: '请输入验证码',
    validate(input) {
      if (!input) {
        return '验证码不能为空';
      }
      return true;
    },
  }];
  const verifyCodeAns = await inquirer.prompt(verifyPromps);
  await page.type('#pass > div > div > div.login-area > div.mobile-form > div:nth-child(4) > div > input', verifyCodeAns.verifyCode);

  await page.waitFor(1000);

  // 点击登录
  const loginBtn = await page.$('#pass > div > div > div.login-area > div.mobile-form > button');
  loginBtn.click();
}

async function weixinGetImg(browser, iframeUrl) {
  const page = await browser.newPage();
  await page.goto(iframeUrl);
  await page.waitFor('body > div.old-template > div > div > div.waiting.panelContent > div.wrp_code > img');
  const imgsrc = await page.$eval('body > div.old-template > div > div > div.waiting.panelContent > div.wrp_code > img', selector => selector.src);
  const uriObj = url.parse(page.url());
  const fullSrc = `${uriObj.protocol}//${uriObj.host}${imgsrc}`;
  await page.close();
  return fullSrc;
}

// async function weixinLogin(page) {
//   const frame = page.frames().find(frame => frame.name() === 'myframe');
// }

(async () => {
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
  await page.goto('https://passport.kaikeba.com/login');
  // await page.waitForNavigation();
  await page.waitFor('#login_container > iframe');
  await page.waitFor(1000);

  await page.screenshot({ path: './example.png' });

  const loginPromps = [{
    type: 'list',
    name: 'logintype',
    message: '请选择登录方式',
    choices: [
      {
        name: '微信登录(默认)',
        value: 'weixin',
      },
      {
        name: '手机号登录',
        value: 'mobile',
      },
    ],
  }];
  const loginAns = await inquirer.prompt(loginPromps);
  switch (loginAns.logintype) {
    default:
    case 'weixin':
      console.log(chalk.green('请扫码登录'));
      break;
    case 'mobile':
      await mobileLogin(page);
      break;
  }

  const frameEleSrc = await page.$eval('#login_container > iframe', selector => selector.src);
  // console.log(frameEle, frame);
  // console.log(frameEleSrc);
  const qrcodeSrc = await weixinGetImg(browser, frameEleSrc);
  console.log(qrcodeSrc);

  await page.waitForNavigation();
  await page.waitFor('#app > div.home-area.router-view > div.type-course > div > div.ivu-tabs-content > div:nth-child(1) > div > div > div > div:nth-child(2) > div.dake');
  await page.waitFor(2000);

  const dakeList = await page.$$('#app > div.home-area.router-view > div.type-course > div > div.ivu-tabs-content > div:nth-child(1) > div > div > div > div:nth-child(2) > div.dake');
  console.log(dakeList.length);

  await browser.close();
})();
