# common.cssセット
master ブランチはrwd対応

- [x] W3C CSS 検証サービス

## 基本ディレクトリ構成
~~~
.
├── dist
│   └── https
│       └── shared
│           └── css
│               └── common.css
└── src
    ├── https
    │   └── shared
    │       └── css
    │           └── common.scss
    └── template_scss
        ├── base
        │   ├── _setting.scss
        │   └── _universal.scss
        └── mixin
            └── _breakpoint.scss
~~~

## sassファイルの説明

### リセットついて
`/src/template_scss/base/_setting.scss`  
- bodyに使うcolor,background-color,font-familyは6行目〜9行目の変数で管理
- テキスト等のline-height、画像のwrapper用の汎用classを設置
  + `.txt { line-height: 1.8;}`
  + `.img-wrap { font-size: 0; line-height: 0;}`

### ユニバーサルクラスについて
`/src/template_scss/base/_universal.scss`

#### 機能
- font-size
- clear-fix
- text-align
- display
- br
- button
- margin
- padding
- margin-increment
- padding-increment

##### 利用にあたって
上記の機能を全て利用すると容量が多すぎるため、  
機能自体を利用するか利用しないかを選択することができる。または利用したい機能のみを選択することができる。
以下はdefault
~~~
$all: true !default;

$font-size: true !default;
$clear-fix: true !default;
$text-align: true !default;
$display: true !default;
$br: true !default;
$button: true !default;
$margin: true !default;
$padding: true !default;
$margin-increment: false !default;
$padding-increment: false !default;
~~~
ユニバーサルclass自体を利用しない場合は  
`$all: true !default;`  
を  
`$all: false !default;`  
にする  
  
利用する機能のみ選択する場合は  
（font-sizeのみ利用の場合）
~~~
$all: true !default;

$font-size: true !default;
$clear-fix: false !default;
$text-align: false !default;
$display: false !default;
$br: false !default;
$button: false !default;
$margin: false !default;
$padding: false !default;
$margin-increment: false !default;
$padding-increment: false !default;
~~~
`$font-size`のみ`true`にする

##### marginとpaddingについて
値は 変数で管理する  
以下がdefault   でSP の場合以下の値の半分で 指定される  
例）$u-mgpd-xl場合、  
SP: 30
PC: 60
~~~
$u-mgpd-xxs: 10;
$u-mgpd-xs: 20;
$u-mgpd-s: 30;
$u-mgpd-m: 40;
$u-mgpd-l: 50;
$u-mgpd-xl: 60;
$u-mgpd-xxl: 80;
~~~