///import core
///commands 远程图片抓取
///commandsName  catchRemoteImage,catchremoteimageenable
///commandsTitle  远程图片抓取
/**
 * 远程图片抓取,当开启本插件时所有不符合本地域名的图片都将被抓取成为本地服务器上的图片
 */
UE.plugins["catchremoteimage"] = function() {
  var me = this,
    ajax = UE.ajax;

  /* 设置默认值 */
  if (me.options.catchRemoteImageEnable === false) return;
  me.setOpt({
    catchRemoteImageEnable: false
  });

  me.addListener("afterpaste", function() {
    me.fireEvent("catchRemoteImage");
  });

  me.addListener("catchRemoteImage", function() {
    var catcherLocalDomain = me.getOpt("catcherLocalDomain"),
      catcherActionUrl = me.getActionUrl(me.getOpt("catcherActionName")),
      catcherUrlPrefix = me.getOpt("catcherUrlPrefix"),
      catcherFieldName = me.getOpt("catcherFieldName");

    var remoteImages = [],
      imgs = domUtils.getElementsByTagName(me.document, "img"),
      test = function(src, urls) {
        if (src.indexOf(location.host) != -1 || /(^\.)|(^\/)/.test(src)) {
          return true;
        }
        if (urls) {
          for (var j = 0, url; (url = urls[j++]); ) {
            if (src.indexOf(url) !== -1) {
              return true;
            }
          }
        }
        return false;
      };
    for (var i = 0, ci; ci = imgs[i++];) {
      if (ci.getAttribute("word_img")) {
          continue;
      }
      var src = ci.getAttribute("_src") || ci.src || "";
      if (/^(https?|ftp):/i.test(src) && !test(src, catcherLocalDomain)) {
          remoteImages.push(src);
      }
    }

    if (remoteImages.length) {
      for(var j=0;j<remoteImages.length;j++) {
        (function(i) {
          var image = remoteImages[j]
          imgUrlUpload(image, i, remoteImages.length)
        })(j)
      }
    }
    function imgUrlUpload(imgurl, imgIdx, imagesSize) { // imgurl是你的网络图片地址
      window.URL = window.URL || window.webkitURL;
      var xhr = new XMLHttpRequest();
      xhr.open("get", imgurl, true);
      xhr.responseType = "blob"; // 至关重要
      xhr.onload = function () {
        if (this.status == 200) {
          //得到一个blob对象
          var blob = this.response;
          var imgUrlArr = imgurl.split('/')
          var fieldName = imgUrlArr[imgUrlArr.length - 1]
          if (fieldName.includes('?')) {
              fieldName = fieldName.split('?')[0]
          }
          /* 创建Ajax并提交 */
          var xhr = new XMLHttpRequest(),
              fd = new FormData(),
              params = utils.serializeParam(me.queryCommandValue('serverparam')) || '',
              url = utils.formatUrl(catcherActionUrl + (catcherActionUrl.indexOf('?') == -1 ? '?':'&') + params);
          fd.append(catcherFieldName, blob, fieldName);
          fd.append('type', 'ajax');
          xhr.open("post", url, true);
          xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          xhr.addEventListener('load', function (e) {
            try{
                var json = (new Function("return " + utils.trim(e.target.response)))();
                if (json.code == 0 && json.data) {
                    var ci = imgs[imgIdx]
                    console.log(ci)
                    newSrc = catcherUrlPrefix + json.data;
                    domUtils.setAttributes(ci, {
                        "src": newSrc,
                        "_src": newSrc
                    });
                    if (imgIdx === imagesSize - 1) {
                        me.fireEvent('catchremotesuccess')
                    }
                } else {
                    me.fireEvent(json.message);
                }
            }catch(er){
                me.fireEvent("catchremoteerror");
            }
          });
          xhr.send(fd);
        } else {
            alert('远程图片加载失败！')
        }
      }
      xhr.send()
    }
  });
};
