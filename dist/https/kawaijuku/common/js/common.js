(function($){
  'use strict';
  /*var
  ----------------------------------------------------------------------*/
  var DATAPREF = '-cmnjs';
  var globalKey = 'cmnjs';

  if(globalKey && window[globalKey]==null){
    window[globalKey]={};
  }else{
    globalKey = false;
  }

  /*module
  ----------------------------------------------------------------------*/

  /**
  * スムーズスクロール
  * 対象　[href^="#"][data-cmnjs-smoothscroll]
  */
  $(function() {
    var dataName = 'data'+DATAPREF+'-smoothscroll';
    var speed = 300;
    var easing = 'swing';
    var $win = $(window);

    var getScrollableElm = (function(){
      var $scrollable = null;
      return function(){
        if(!$scrollable){
          $('html,body').each(function(){
            var $this = $(this);
            if($this.scrollTop() > 0){
              $scrollable = $this;
              return false;
            }else{
              $this.scrollTop(1);
              if( $this.scrollTop() > 0 ){
                $scrollable = $this;
                return false;
              }
              $this.scrollTop(0);
            }
          });
        }
        return $scrollable;
      };
    })();
    $(document).on('click', '[href^="#"][data-cmnjs-smoothscroll]', function(){
      var $this = $(this);
      var $scroller = getScrollableElm();
      var pos,curpos;
      var href = $this.attr('href');
      var $target = $(href === '#'? 'html' : href);
      if($target.length){
        if($scroller){
          pos = $target.offset().top;
          curpos = Number($win.scrollTop());
          location.href = location.href.split('#')[0]+href;
          $scroller.scrollTop(curpos).animate({scrollTop:pos}, speed, easing);
        }else{
          location.href = location.href.split('#')[0]+href;
        }
        return false;
      }else{
        return true;
      }
    });
  });

  /**
  * アコーディオン
  * ボタンのクリックでボタンにアクティブクラスを付与し、対応するエリアを開閉アニメーション
  * 開閉後displayスタイルを取り除き、エリアにアクティブクラスを付与する
  */
  //constructor
  var Accordion = function(opt){
    var thisO = this;
    this.$btn = opt.$btn;
    this.$area = opt.$area;
    this.activeBtnClass = opt.activeBtnClass || '';
    this.activeAreaClass = opt.activeAreaClass || '';
    this.openedFlg = opt.openedFlg;
    this.speed = opt.speed||200;
    this.onBeforeDisplayChange = opt.onBeforeDisplayChange || function(){};
    this.onAfterDisplayChange  = opt.onAfterDisplayChange  || function(){};
    this.busyFlg = false;
    this.useDisplayCheck = !!opt.useDisplayCheck;
    this.$btn.on('click',function(){
      this.blur();
      thisO.displayChange(!thisO.openedFlg);
    });
    this.displayChange(thisO.openedFlg, true, true);
  };
  Accordion.prototype.displayChange = function(flg, noAnimationFlg, initFlg){
    var visibleCheck,hasActiveClass;
    if(!initFlg && this.useDisplayCheck){
      if(flg){
        hasActiveClass = this.$area.hasClass(this.activeAreaClass);
        visibleCheck = this.$area.is(':visible');
        if(visibleCheck){return;}
        this.$area.addClass(this.activeAreaClass);
        visibleCheck = this.$area.is(':visible');
        if(!hasActiveClass){
          this.$area.removeClass(this.activeAreaClass);
        }
        if(!visibleCheck){return;}
      }else{
        hasActiveClass = this.$area.hasClass(this.activeAreaClass);
        visibleCheck = this.$area.is(':visible');
        if(!visibleCheck){return;}
        this.$area.removeClass(this.activeAreaClass);
        visibleCheck = this.$area.is(':visible');
        if(hasActiveClass){
          this.$area.addClass(this.activeAreaClass);
        }
        if(visibleCheck){return;}
      }
    }
    if(this.busyFlg){return;}
    this.busyFlg = true;
    if(this.onBeforeDisplayChange(flg) === false){
      this.busyFlg = false;
      return;
    }
    var thisO = this;
    var speed = noAnimationFlg? 0: this.speed;
    if(flg){//open
      this.$btn.addClass(this.activeBtnClass);
      this.$area.slideDown(speed,'swing',function(){thisO.displayChangeCallback(flg);});
    }else{//close
      this.$btn.removeClass(this.activeBtnClass);
      this.$area.slideUp(speed,'swing',function(){thisO.displayChangeCallback(flg);});
    }
  };
  Accordion.prototype.displayChangeCallback = function(flg){
    this.openedFlg = flg;
    if(flg){
      this.$area.addClass(this.activeAreaClass);
    }else{
      this.$area.removeClass(this.activeAreaClass);
    }
    this.$area.css({display:''});
    this.onAfterDisplayChange(flg);
    this.busyFlg = false;
  };
  if(globalKey){window[globalKey].Accordion = Accordion;}
  
  $(function(){
    /**
    * ラッパー汎用型Accordionの生成
    *  ラッパー：[data-cmnjs-accordion-role="wrap"]
    *  ボタン　：[data-cmnjs-accordion-role="wrap"] [data-cmnjs-accordion-role="btn"]
    *  エリア　：[data-cmnjs-accordion-role="wrap"] [data-cmnjs-accordion-role="area"]
    *  アクティブボタン・エリアに付与されるクラス：accordionActive
    *  ラッパーの data-cmnjs-accordion-active 属性の指定があれば初期状態で開く
    */
    var wrapData = 'data'+DATAPREF+'-accordion-role=wrap';
    var btnData = 'data'+DATAPREF+'-accordion-role=btn';
    var areaData = 'data'+DATAPREF+'-accordion-role=area';
    var activeClass = 'accordionActive';
    var defaultOpendData = 'data'+DATAPREF+'-accordion-active';

    //ラッパー汎用型生成
    $('['+wrapData+']').each(function(){
      var $wrap = $(this);
      var $nested = $wrap.find('['+wrapData+']'+' *');//ネストを考慮
      var $btn = $wrap.find('['+btnData+']').not($nested);
      var $area = $wrap.find('['+areaData+']').not($nested);
      if($btn.length && $area.length){
        new Accordion({
          $btn: $btn,
          $area: $area,
          activeBtnClass: activeClass,
          activeAreaClass: activeClass,
          openedFlg: (typeof $wrap.attr(defaultOpendData) !== 'undefined'),
          useDisplayCheck: true
        });
      }
    });
  });

})(jQuery);