/**
 * @description
 * 简单上传:点击按钮,直接选择文件上传
 * @author Jinqn
 * @date 2014-03-31
 */
UE.plugin.register("simpleupload", function() {
  var me = this,
    containerBtn,
    timestrap = (+new Date()).toString(36);

    function initUploadBtn() {
      var w = containerBtn.offsetWidth || 20,
        h = containerBtn.offsetHeight || 20,
        btnStyle = 'display:block;width:' + w + 'px;height:' + h + 'px;overflow:hidden;border:0;margin:0;padding:0;position:absolute;top:0;left:0;filter:alpha(opacity=0);-moz-opacity:0;-khtml-opacity: 0;opacity: 0;cursor:pointer;';
  
      var form = document.createElement('form');
      var input = document.createElement('input');
      form.id = 'edui_form_' + timestrap;
      form.enctype = 'multipart/form-data';
      form.style = btnStyle;
      input.id = 'edui_input_' + timestrap;
      input.type = 'file'
      input.accept = 'image/*';
      input.name = me.options.imageFieldName;
      input.style = btnStyle;
      form.appendChild(input);
      containerBtn.appendChild(form);
  
      input.addEventListener('change', function(event) {
        if (!input.value) return;
        var loadingId = 'loading_' + (+new Date()).toString(36); // imageActionName scrawlActionName
        var imageActionUrl = me.getActionUrl(me.getOpt('imageActionName'));
        var params = utils.serializeParam(me.queryCommandValue('serverparam')) || '';
        var action = utils.formatUrl(imageActionUrl + (imageActionUrl.indexOf('?') == -1 ? '?' : '&') + params);
        var allowFiles = me.getOpt('imageAllowFiles');
        me.focus();
        me.execCommand('inserthtml', '<img class="loadingclass" id="' + loadingId + '" src="' + me.options.themePath + me.options.theme + '/images/spacer.gif" title="' + (me.getLang('simpleupload.loading') || '') + '" >');
  
        function showErrorLoader(title) {
          if (loadingId) {
            var loader = me.document.getElementById(loadingId);
            loader && domUtils.remove(loader);
            me.fireEvent('showmessage', {
              'id': loadingId,
              'content': title,
              'type': 'error',
              'timeout': 4000
            });
          }
        }
        /* 判断后端配置是否没有加载成功 */
        // imageActionName scrawlActionName
        if (!me.getOpt('imageActionName')) {
          showErrorLoader(me.getLang('autoupload.errorLoadConfig'));
          return;
        }
        // 判断文件格式是否错误
        var filename = input.value,
          fileext = filename ? filename.substr(filename.lastIndexOf('.')) : '';
        if (!fileext || (allowFiles && (allowFiles.join('') + '.').indexOf(fileext.toLowerCase() + '.') == -1)) {
          showErrorLoader(me.getLang('simpleupload.exceedTypeError'));
          return;
        }
  
        var xhr = new XMLHttpRequest()
        xhr.open('post', action, true)
        if (me.options.headers && Object.prototype.toString.apply(me.options.headers) === "[object Object]") {
          for (var key in me.options.headers) {
            xhr.setRequestHeader(key, me.options.headers[key])
          }
        }
        xhr.onload = function() {
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
            var res = JSON.parse(xhr.responseText)
            var link = me.options.imageUrlPrefix + res.data;
            if (res.code == 0 && res.data) {
              loader = me.document.getElementById(loadingId);
              loader.setAttribute('src', link);
              loader.setAttribute('_src', link);
              loader.setAttribute('title', res.title || '');
              loader.setAttribute('alt', res.original || '');
              loader.removeAttribute('id');
              domUtils.removeClasses(loader, 'loadingclass');
              me.fireEvent("contentchange");
            } else {
              showErrorLoader(res.code);
            }
          } else {
            showErrorLoader(me.getLang('simpleupload.loadError'));
          }
        };
        xhr.onerror = function() {
          showErrorLoader(me.getLang('simpleupload.loadError'));
        };
        xhr.send(new FormData(form));
        form.reset();
      })
    }
  
    return {
      bindEvents: {
        'ready': function() {
          //设置loading的样式
          utils.cssRule('loading',
            '.loadingclass{display:inline-block;cursor:default;background: url(\'' +
            this.options.themePath +
            this.options.theme + '/images/loading.gif\') no-repeat center center transparent;border:1px solid #cccccc;margin-right:1px;height: 22px;width: 22px;}\n' +
            '.loaderrorclass{display:inline-block;cursor:default;background: url(\'' +
            this.options.themePath +
            this.options.theme + '/images/loaderror.png\') no-repeat center center transparent;border:1px solid #cccccc;margin-right:1px;height: 22px;width: 22px;' +
            '}',
            this.document);
        },
        /* 初始化简单上传按钮 */
        'simpleuploadbtnready': function(type, container) {
          containerBtn = container;
          me.afterConfigReady(initUploadBtn());
        }
      },
      outputRule: function(root) {
        utils.each(root.getNodesByTagName('img'), function(n) {
          if (/\b(loaderrorclass)|(bloaderrorclass)\b/.test(n.getAttr('class'))) {
            n.parentNode.removeChild(n);
          }
        });
      }
    }
});
