// ●●●●年●●月に定めたDNPデジタルソリューションズのコンテンツ制作の推奨環境
const browserVersion = [
  'Android >= 4.4',
  'Chrome >= 57',
  'ChromeAndroid >= 57',
  'Edge >= 14',
  'Firefox >= 52',
  'ie 11',
  'iOS >= 9',
  'Safari >= 9'
];

const port = {};
port.http = 33456;
port.https = 43456;

// 以降は触らない

const SRC_DIR = `src`;
const DIST_DIR = `dist`;

const exec = require ( 'child_process' ).exec;
const vnu = require ( 'vnu-jar' );

const autoprefixer = require(`gulp-autoprefixer`);
const connectSSI = require(`connect-ssi`);
const gulp = require(`gulp`);
const htmlhint = require(`gulp-htmlhint`);
const notify = require(`gulp-notify`);
const plumber = require(`gulp-plumber`);
const sass = require(`gulp-sass`);
const webserver = require(`gulp-webserver`);
const header = require(`gulp-header`);
const replace = require(`gulp-replace`);
const fs = require(`fs`);
const glob = require(`glob`);
const intercept = require(`gulp-intercept`);
const encoding = require(`encoding-japanese`);
var os = require('os');
const path = require('path');

//引数取得
const arg = (argList => {
  let arg = {}, a, opt, thisOpt, curOpt;
  for (a = 0; a < argList.length; a++) {
    thisOpt = argList[a].trim();
    opt = thisOpt.replace(/^\-+/, '');
    if (opt === thisOpt) {
      if (curOpt) arg[curOpt] = opt;
      curOpt = null;
    }
    else {
      curOpt = opt;
      arg[curOpt] = true;
    }
  }
  return arg;
})(process.argv);

//ローカルIPアドレス取得
var localIpAddress;
(function(ifaces){
   Object.keys(ifaces).forEach(function (ifname) {
     ifaces[ifname].forEach(function (iface) {
       if ('IPv4' !== iface.family || iface.internal !== false) {
         // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
         return;
       }
       // en0 192.168.1.NNN
       localIpAddress = iface.address;
     });
   });
})(os.networkInterfaces());

//sass
gulp.task(`sass`, function() {
  return gulp.src(`${SRC_DIR}/**/*.scss`)
  .pipe(plumber({
    errorHandler: notify.onError('<%= error.message %>')
  }))
  .pipe(sass({
    outputStyle: `compact`
  }))
  .pipe(autoprefixer({
    browsers: browserVersion,
    cascade: false
  }))
  .pipe(replace(/@charset "UTF-8";/g, ''))
  .pipe(header('@charset "UTF-8";\n\n'))
  .pipe(gulp.dest(`./${DIST_DIR}`))
  .pipe(notify(`Sassをコンパイルしました`));
});

//html-hint
gulp.task(`html-hint`, function() {
  gulp.src([`${DIST_DIR}/**/*.html`, `!${DIST_DIR}/**/ssi/**/*.html`])
  .pipe(htmlhint())
  .pipe(htmlhint.reporter());
});

// server
gulp.task(`server`, function() {
  gulp.src(`${DIST_DIR}/http`)
    .pipe(webserver({
      host: `localhost`,
      port: port.http,
      middleware: [
        connectSSI({
          baseDir: `${DIST_DIR}/http`,
          ext: `.html`
        })
      ]
    })).pipe(webserver({
      host: localIpAddress,
      port: port.http,
      middleware: [
        connectSSI({
          baseDir: `${DIST_DIR}/http`,
          ext: `.html`
        })
      ]
    }));

  gulp.src(`${DIST_DIR}/https`)
    .pipe(webserver({
      host: `localhost`,
      port: port.https,
      middleware: [
        connectSSI({
          baseDir: `${DIST_DIR}/https`,
          ext: `.html`
        })
      ]
    })).pipe(webserver({
      host: localIpAddress,
      port: port.https,
      middleware: [
        connectSSI({
          baseDir: `${DIST_DIR}/https`,
          ext: `.html`
        })
      ]
    }));
});

// watch
gulp.task(`watch`, function(){
  gulp.watch(`${SRC_DIR}/**/*.scss`, [`sass`]);
  gulp.watch(`${DIST_DIR}/**/*.html`, [`html-hint`]);
});


// default
gulp.task(`default`,[`watch`, `server`]);


/*
* バリデーションタスク
*/
//valid,twxtValidタスクで使用する変数
var htmlValidVars;
function htmlValidVarsInit(){
  var timestamp = (()=>{
    var dt = new Date();
    var y = dt.getFullYear();
    var m = ('00' + (dt.getMonth()+1)).slice(-2);
    var d = ('00' + dt.getDate()).slice(-2);
    var hours = ('00' + dt.getHours()).slice(-2);
    var min = ('00' + dt.getMinutes()).slice(-2);
    var sec = ('00' + dt.getSeconds()).slice(-2);
    var result = y+'-'+m+'-'+d+' '+hours+':'+min+':'+sec;
    return result;
  })();
  var res = {
    errorFlg: false,
    targetPath: arg.d?`${arg.d}/**/*.{html,shtml}`:`./${DIST_DIR}/**/*.{html,shtml}`,
    targetFile: arg.f,
    result: {
      _: {date:timestamp},
      data: {}
    },
    newline: null,
    makeReport: function(){
      if(this.errorFlg){
        this.result._.message = '内部エラーが発生しました バリデート結果が正しくない可能性があります';
      }
      fs.writeFileSync((arg.o?`${arg.o}.json`:'validationReport.json'),JSON.stringify(this.result,undefined,2), {encoding: 'utf-8'});
    },
    fence: {
      L:'=========================================',
      S:'-------------------------------------'
    }
  };
  //改行コードオプション指定
  if(arg.newline){
    ((newline = arg.newline.toUpperCase()) => {
      switch (newline){
        case 'CRLF':
        case 'CR':
          res.newline = newline;
          res.result._.newline = newline;
      }
    })();
  }
  return res;
}
/*textValid 文字コード、文字検索、改行コードのチェック*/
gulp.task('textValid', function(callback) {
  if(!htmlValidVars){htmlValidVars = htmlValidVarsInit();}
  //完全終了時処理と完全終了判定用変数
  var interceptCnt = 0;
  var httpCheckOutput = [];
  var fenceS = htmlValidVars.fence.S;
  var fenceL = htmlValidVars.fence.L;
  
  gulp.src(htmlValidVars.targetFile||htmlValidVars.targetPath)
  .pipe(
    intercept(function(file){
      interceptCnt++;
      var relativePath = '/'+file.path.split(`/${DIST_DIR}/`)[1];
      //テキスト判定 + 文字コードチェック + 改行コードチェック
      (function(){
        var logArr = [];
        var reportArr = [];

        //文字コードチェック
        var charset = encoding.detect(file.contents);
        if(charset!=='UTF8' && charset!=='ASCII'){
          logArr.push('\u{1f41e} 文字コードがUTF-8ではありません（' +charset+'）');
          reportArr.push({
            message:'文字コードがUTF-8ではありません',
            detail: charset
          });
        }
        
        var contents = file.contents.toString();
        //改行コードチェック
        if(!htmlValidVars.newline){//デフォルト LF判定
          if(contents.indexOf('\r')>=0){
            logArr.push('\u{1f41e} 改行コードがLFではありません');
            reportArr.push({
              message:'改行コードがLFではありません'
            });
          }
        }else if(htmlValidVars.newline === 'CR'){
          if(contents.indexOf('\n')>=0){
            logArr.push('\u{1f41e} 改行コードがCRではありません')
            reportArr.push({
              message:'改行コードがCRではありません'
            });
          }
        }else if(htmlValidVars.newline === 'CRLF'){
          if(contents.indexOf('\r\n')<0 && (contents.indexOf('\r')>=0 || contents.indexOf('\n')>=0)){
            logArr.push('\u{1f41e} 改行コードがCRLFではありません')
            reportArr.push({
              message:'改行コードがCRLFではありません'
            });
          }
        }
        //特殊文字チェック
        var wordCheck =  contents.match(/[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ㌂㌅㌌㌍㌎㌔㌕㌖㌗㌘㌜㌢㌤㌧㌨㌫㌭㌳㌶㌹㌻㌽㌾㍄㍉㍊㍋㍍㍎㍑㍗㎅㎆㎇㎎㎏㎐㎑㎒㎓㎖㎗㎘㎜㎝㎞㎟㎠㎡㎢™©®]/g);
        if(wordCheck){
          logArr.push('\u{1f41e} 以下の特殊文字が含まれています\n'+fenceS+'\n'+wordCheck.join(',')+'\n'+fenceS);
          reportArr.push({
            message:'特殊文字が含まれています',
            detail:wordCheck
          });
        }
        //フルパスチェック
        var httpCheck = contents.match(/.*https?:.*/g);
        if(httpCheck){
          logArr.push('\u{1f41e} 下記箇所にhttp,httpsの記述が存在します\n'+fenceS+'\n'+httpCheck.join('\n')+'\n'+fenceS);
          reportArr.push({
            message:'http,httpsの記述が存在します',
            detail:httpCheck
          });
          httpCheckOutput.push(relativePath+'\n'+fenceS+'\n'+httpCheck.join('\n')+'\n');
        }
        //出力
        logArr.unshift((interceptCnt+'：')+relativePath);
        logArr.unshift('/'+fenceL);
        logArr.push(fenceL+'/');
        console.log(logArr.join('\n'));
        htmlValidVars.result.data[relativePath] = {textvalid:reportArr};
        return;
      })();
    })//intercept
  )
  .on('end',function(){
    htmlValidVars.makeReport();
    if(!httpCheckOutput.length){
      httpCheckOutput.push('http,httpsの文字列はありません');
    }
    fs.writeFile((arg.o?`${arg.o}.json`:'validationReport')+'_fullPath.txt', httpCheckOutput.join('\n'+fenceL+'\n\n'), {encoding: 'utf-8'});
    if(typeof callback === 'function'){
      callback();
    }
  });
});
/*w3cValid*/
gulp.task('valid',['textValid'],function(){
  console.log('\n[W3Cバリデーション実行中] 終了まで時間が掛かる場合がありますのでコマンドプロンプトが戻るまで暫くお待ち下さい');
  //上階層半スペエラー
  if(process.cwd().indexOf(' ')>0){
    console.log('\n\u{1f916} パス内に半角スペースがあるとバリデーションを実行できません');
    htmlValidVars.errorFlg = true;
    htmlValidVars.makeReport();
    return;
  }
  if(!htmlValidVars){htmlValidVars = htmlValidVarsInit();}
  var fenceS = htmlValidVars.fence.S;
  var fenceL = htmlValidVars.fence.L;
  var pathArr;
  if(htmlValidVars.targetFile){
    //ファイル指定の場合存在を確認する
    try {
      fs.statSync(htmlValidVars.targetFile);
      pathArr = [htmlValidVars.targetFile];
    } catch(err) {
      return;
    }
  }else{
    pathArr = glob.sync(htmlValidVars.targetPath);
  }
  pathArr.map((path) => {
    var relativePath = '/'+path.split(`/${DIST_DIR}/`)[1];
    if(!htmlValidVars.result.data[relativePath]){htmlValidVars.result.data[relativePath]={};}
    //下層半スペエラー
    if(path.indexOf(' ')>0){
      console.log('/'+fenceL);
      console.log(relativePath, '\n\u{1f916} パス内に半角スペースがあるとバリデーションを実行できません');
      htmlValidVars.errorFlg = true;
      console.log(fenceL+'/');
      htmlValidVars.result.data[relativePath].w3cvalid = [{_:'検証ツール内部エラー',message: 'パス内に半角スペースがあるとバリデーションを実行できません'}];
      htmlValidVars.makeReport();
      return;
    }
    htmlValidVars.result.data[relativePath].w3cvalid = [];
    htmlValidVars.makeReport();
  });

  /**
   * HTMLのバリデーション処理
   * 
   * pathArrにリストされているファイルの検証を行う
   * 以下のようにすると対象ディレクトリ以下のhtmlファイルの検証を行う
   * `java -jar ${vnu} --format json ${dirName}`
   */
  exec (`java -jar ${vnu} --format json ${pathArr.join(' ')}`, { maxBuffer: 5000 * 1024 }, (error, stdout, stdin) => {
    if (error) {

      let errorMessages = {};

      // error変数に不要な情報が付加されているので、ゴリ押しでJSON部分のみを抽出
      // エラーはファイル単位ではなく、エラー単位（１つのファイルに複数のエラーがあった場合、複数の結果が返ってくる）となるため、
      // ファイル単位で変数 erroMessages に格納する
      JSON.parse(error.toString().split('\n')[1]).messages
        .forEach((json) => {
          const { message } = json;
          let { url } = json;
          delete json['url'];

          url = path.resolve(url.replace('file:', '')).replace(`${__dirname}/dist`, '');

          if (!errorMessages[url]) {
            errorMessages[url] = [];
          }
          errorMessages[url].push(json);
        });
      
      Object.keys(errorMessages)
        .forEach((key) => {
          try {
            htmlValidVars.result.data[key].w3cvalid = errorMessages[key];
          }
          catch (e) {
          }
        });

      Object.keys(errorMessages)
        .forEach((key) => {
          console.log(`/${fenceL}
${key}
\u{1f916} バリデーションエラーがあります
${fenceS}`);

          errorMessages[key]
            .forEach((errorMessage) => {
              console.log(`type:${errorMessage.type}
lastLine:${errorMessage.lastLine}
lastColumn:${errorMessage.lastColumn}
message:${errorMessage.message}
extract:${errorMessage.extract || ''}
hiliteStart:${errorMessage.hiliteStart || ''}
hiliteLength:${errorMessage.hiliteLength || ''}
${fenceS}`);
            });
          console.log(`${fenceL}/`);
        });
      htmlValidVars.makeReport();
      return;
    }
 
    console.log ('バリデーションエラーはありませんでした。'); 
    htmlValidVars.makeReport();
  });
});