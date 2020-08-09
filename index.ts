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

let workBrowser = null;
let workPage = null;

async function generateWorkProcess(url = '') {
  // 找到本机安装的 chrome
  const findChromePath = await findChrome({});
  const executablePath = findChromePath.executablePath;

  workBrowser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    devtools: false,
    // args: [''],
    executablePath,
  });

  workPage = await this.workBrowser.newPage();
  await workPage.goto(url, { waitUntil: 'networkidle2' });
  // await page.waitForNavigation();
}

async function mobileLogin() {
  const phoneBtn = await workPage.$('div.others-item .item-text');
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
  await workPage.type('#pass > div > div > div.login-area > div.mobile-form > div:nth-child(2) > input', mobileAns.mobile);

  await workPage.waitFor(1000);

  // 发送验证码
  const verifyBtn = await workPage.$('#pass > div > div > div.login-area > div.mobile-form > div:nth-child(4) > div > button');
  verifyBtn.click();

  await workPage.waitFor(1000);

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
  await workPage.type('#pass > div > div > div.login-area > div.mobile-form > div:nth-child(4) > div > input', verifyCodeAns.verifyCode);

  await workPage.waitFor(1000);

  // 点击登录
  const loginBtn = await workPage.$('#pass > div > div > div.login-area > div.mobile-form > button');
  loginBtn.click();
}

// 获取微信登录二维码图片地址, 暂时先不做
async function weixinGetImg(iframeUrl) {
  const page = await workBrowser.newPage();
  await page.goto(iframeUrl);
  await page.waitFor('body > div.old-template > div > div > div.waiting.panelContent > div.wrp_code > img');
  const imgsrc = await page.$eval('body > div.old-template > div > div > div.waiting.panelContent > div.wrp_code > img', selector => selector.src);
  const uriObj = url.parse(page.url());
  const fullSrc = `${uriObj.protocol}//${uriObj.host}${imgsrc}`;
  await page.close();
  return fullSrc;
}

// 解析二维码图片, 后期作为console内容展示给控制台
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

// 微信登录
// async function weixinLogin(page) {
//   const frame = workPage.frames().find(frame => frame.name() === 'myframe');
// }

async function handleItem(type, itemItem) {
  if (/点播/.test(type)) {
    await itemItem.click();
    await workPage.waitForNavigation({ waitUntil: 'networkidle2' });
    await workPage.waitForSelector('.');
    return 
  }
}

async function traverseItem(itemList = [], cindex = 0) {
  if (cindex > itemList.length) {
    return;
  }

  const itemItem = itemList[cindex];
  const itemType = itemItem.$eval('.section-box .contont-title span', ele => ele.textContent);
  
}

async function traverseSection(sectionList = [], cindex = 0) {
  if (cindex > sectionList.length) {
    return;
  }
  const sectionItem = sectionList[cindex];
  const itemList = await sectionItem.$$('.ivu-timeline .ivu-timeline-item');
  console.log(`本节有 ${sectionList.length} 条`);
  
  await traverseItem(itemList);
}

async function traverseChapter(chapterList = [], cindex = 0) {
  if (cindex > chapterList.length) {
    return;
  }
  const chapterItem = chapterList[cindex];
  const isActive = workPage.evaluate(ele => {
    ele.classList.contains('ivu-collapse-item-active');
  }, chapterItem);
  if (!isActive) {
    await chapterItem.click();
  }
  const sectionList = await chapterItem.$$('.ivu-collapse-content .chapter-item');
  console.log(`本章有 ${sectionList.length} 节`);

  await traverseSection(sectionList);
}

async function traverseDake(dakeList = [], cindex = 0) {
  if (cindex > dakeList.length) {
    return;
  }
  const intoBtn = await dakeList[cindex].$('button.goon-and-review-btn');
  await intoBtn.click();
  await workPage.waitForNavigation({ waitUntil: 'networkidle2' });
  await workPage.waitFor(1000);

  const chapterList = await workPage.$$('div.chapter .ivu-collapse .ivu-collapse');
  console.log(`本课程有 ${chapterList.length} 章`);

  await traverseChapter(chapterList);
}

(async () => {
  await generateWorkProcess('https://passport.kaikeba.com/login');

  await workPage.waitFor('#login_container > iframe');
  await workPage.waitFor(1000);

  await workPage.screenshot({ path: './example.png' });

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
      await mobileLogin();
      break;
  }

  // const frameEleSrc = await page.$eval('#login_container > iframe', selector => selector.src);
  // // console.log(frameEle, frame);
  // // console.log(frameEleSrc);
  // const qrcodeSrc = await weixinGetImg(browser, frameEleSrc);
  // console.log(qrcodeSrc);


  await workPage.waitForNavigation();
  await workPage.waitFor('#app > div.home-area.router-view > div.type-course > div > div.ivu-tabs-content > div:nth-child(1) > div > div > div > div:nth-child(2) > div.dake');
  await workPage.waitFor(2000);

  const dakeList = await workPage.$$('#app > div.home-area.router-view > div.type-course > div > div.ivu-tabs-content > div:nth-child(1) > div > div > div > div:nth-child(2) > div.dake');
  console.log(dakeList.length);

  const index = 0;
  while (index < dakeList.length) {
    const intoBtn = await dakeList[index].$('button.goon-and-review-btn');
    await intoBtn.click();
    await workPage.waitForNavigation({ waitUntil: 'networkidle2' });
    await workPage.waitFor(1000);

    const chapterList = await workPage.$$('div.chapter .ivu-collapse .ivu-collapse');
    console.log(chapterList.length);

    break;
  }

  // await browser.close();

  // decodeImgSrc('https://open.weixin.qq.com/connect/qrcode/051j9t5445V20w3w');
})();
