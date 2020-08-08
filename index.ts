/* eslint-disable @typescript-eslint/no-var-requires */
const https = require('https');
const puppeteer = require('puppeteer-core');
const findChrome = require('carlo/lib/find_chrome.js');
const inquirer = require('inquirer');
const chalk = require('chalk');
const url = require('url');
const jimp = require('jimp');
const jsQR = require('jsqr');
const pngjs = require('pngjs');

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

// async function decodeImgSrc(imgSrc) {
//   console.log(imgSrc);
//   https.get(imgSrc, res => {
//     const buffer = [];
//     res.on('data', d => {
//       buffer.push(d);
//     });
//     res.on('end', () => {
//       const buff = Buffer.concat(buffer);
//       console.log(buff);
//       // const image = pngjs.PNG.sync.read(buff);
//       // const data = new Uint8Array(image.data);
//       // console.log(data);
//       new pngjs.PNG().parse(buff, (error, data) => {
//         console.log(error);
//         console.log(data);
//       });
//     });
//   });
//   const img = await jimp.read(imgSrc);
//   console.dir(img.getBase64);
//   img.getBase64(jimp.MIME_PNG, (err, buffer) => {
//     console.log(buffer);
//     jsQR(buffer);
//   });
// }

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
  await page.goto('https://passport.kaikeba.com/login', { waitUntil: 'networkidle2' });
  // await page.waitForNavigation();
  await page.waitFor('#login_container > iframe');
  await page.waitFor(1000);

  await page.screenshot({ path: './example.png' });

  const loginPromps = [{
    type: 'list',
    name: 'logintype',
    message: '请选择登录方式',
    choices: [
      // {
      //   name: '微信登录(默认)',
      //   value: 'weixin',
      // },
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

  // const frameEleSrc = await page.$eval('#login_container > iframe', selector => selector.src);
  // // console.log(frameEle, frame);
  // // console.log(frameEleSrc);
  // const qrcodeSrc = await weixinGetImg(browser, frameEleSrc);
  // console.log(qrcodeSrc);


  await page.waitForNavigation();
  await page.waitFor('#app > div.home-area.router-view > div.type-course > div > div.ivu-tabs-content > div:nth-child(1) > div > div > div > div:nth-child(2) > div.dake');
  await page.waitFor(2000);

  const dakeList = await page.$$('#app > div.home-area.router-view > div.type-course > div > div.ivu-tabs-content > div:nth-child(1) > div > div > div > div:nth-child(2) > div.dake');
  console.log(dakeList.length);

  const index = 0;
  while (index < dakeList.length) {
    const intoBtn = await dakeList[index].$('button.goon-and-review-btn');
    await intoBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.waitFor(1000);

    const chapterList = await page.$('div.chapter .ivu-collapse .ivu-collapse');
    console.log(chapterList.length);
  }

  // await browser.close();

  // decodeImgSrc('https://open.weixin.qq.com/connect/qrcode/051j9t5445V20w3w');
})();
