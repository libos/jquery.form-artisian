;(function($) {
    'use strict';

    // $.Deferred.exceptionHook = undefined;
    $.fn.formArtisian = function(plan,options) {
        return this.each(function () {
            new Artisian(this,plan,options);
        });
    };

    $.fn.fart = function(plan,options) {
        $.fn.formArtisian.call(this,plan,options);
    };
    
    function Artisian(element,plan,options) {
        var _defaults = {
            templatePath: utils.relative_path(),
            panel: '#tool-panel',
            designButton: '',
            designSaveUrl:'/save_form',
            designSaveCb: function (json,data) {},
            designSaveErrorCb: function (result,data) {},
            datepicker: false,
            initialized : function () {},
            loadUrl: '/load_form',
            saveUrl: '/save_user_data',
            saveUserDataCb: function (json,data) {},
            saveUserDataErrorCb: function (result,data) {},
        };
        this.element = element;
        
        this.options = $.extend( {}, _defaults, options) ;
        this.init();
        this[plan]();
    }

    Artisian.prototype.init = function() {
            $('body').append('<div id="artisian-tmpls-unique-id-is-not-required"></div>');
            $('#artisian-tmpls-unique-id-is-not-required').load(this.options.templatePath + 'form-elements.tmpl');
            $( "ul, li, input:read-only" ).disableSelection();
    };

    $.extend(Artisian.prototype, {
        design : function () {
            if (this == document) {
                return;
            }
            var self = this;
            $.get(self.options.templatePath + 'tool-panel.tmpl', function (data) {
                    $(self.options.panel).html(data);
                    $(self.options.panel).addClass('form-artisian');
                    self.design.initUI(self);
                    self.options.initialized.call();    
            });
        },
        build : function () {
            if (this == document) {
                return;
            }
            var self = this;
            self.build.init(self);
            $.get(self.options.loadUrl,function (json) {
                self.build.construct(self,json);
                self.build.initEvent(self,json);
            },'json');
        },
        display : function() {
            if (this == document) {
                return;
            }
            var self = this;
            self.display.init(self);
            $.get(self.options.loadUrl,function (json) {
                self.construct(self,json,true);
            },'json');
        },
        sketch : function () {
            if (this == document) {
                return;
            }
            var self = this;
            $.get(self.options.templatePath + 'tool-panel.tmpl', function (data) {
                    $(self.options.panel).html(data);
                    $(self.options.panel).addClass('form-artisian');
                    $.get(self.options.loadUrl,function (json) {
                        self.construct(self,json,false,true);
                    },'json');
                    self.design.initUI(self);
                    self.options.initialized.call();
            });
        }
    });
    $.extend(Artisian.prototype.display,{
        init: function (self) {
            $(self.element).addClass('artisian-display-form').addClass('form-artisian').data('id','workspace');
        }
    });

    $.extend(Artisian.prototype.build,{
        init: function (self) {
            $(self.element).addClass('artisian-build-form').addClass('form-artisian').data('id','workspace');
        },
        initEvent:function (self,json) {
            $(self.element).find('input[type=submit]').on('click',function () {
                var data = self.build.fetchData(self,json);
                if (data.stop) {
                    if ($(self.element).find('.alert.alert-danger').length == 0) {
                        $(self.element).prepend('<div class="alert alert-danger" role="alert">必填项<' + data.label  + '>未填写</div>');    
                    }else{
                        $(self.element).find('.alert.alert-danger').html('必填项<' + data.label  + '>未填写');    
                    }
                    return;
                }
                $.ajax({
                    url: self.options.saveUrl,
                    type: 'post',
                    data: data,
                    dataType:'json'
                }).then(
                function () {
                    self.options.saveUserDataCb(json,data);
                },
                function (jqXHR, textStatus, errorThrown) {
                    self.options.saveUserDataErrorCb({jqXHR:jqXHR, textStatus:textStatus, errorThrown:errorThrown},
                                                        data);
                }).catch(function(arg) {});
            });
        },
        construct: function (self, json) {
            self.construct(self,json);
            if (self.options.datepicker) {
                $('input[type=date]').datepicker({language: 'cn'});
            };
        },
        fetchData: function (self,json) {
            var ret = {};
            for(var key in json){
                var ele = json[key];
                var id = "#element-" + ele.id;
                // debugger
                if (ele.type == 'input') {
                    ele.defaultval =$.trim($(self.element).find(id).find('input').val());
                }
                if (ele.type == 'textarea') {
                    ele.defaultval = $.trim($(self.element).find(id).find('textarea').val());
                }
                if (ele.type == 'file') {
                    var files = $(self.element).find(id).find('input[name=file_url]');
                    if (files.length > 1) {
                        var tmp = [];
                        files.each(function(i,e){ tmp.push( $(e).val()) });
                        ele.defaultval = tmp;
                    }else if (files.length == 1) {
                        ele.defaultval = files.val();
                    }else {
                        ele.defaultval = undefined;
                    }
                }
                if (ele.required == "true") {
                    if (['input','textarea','file'].indexOf(ele.type) != -1) {
                        if (ele.defaultval == '' || ele.defaultval == undefined) {
                            $(self.element).find('.error').removeClass('error');
                            $(self.element).find('#element-' + ele.id).addClass('error');
                            return { stop : true, id: ele.id, label:ele.label };
                        }
                    }
                }
                ret[key] = ele;
            }
            return ret;
        }
    });
    $.extend(Artisian.prototype,{
        construct: function (self,json,display,sketch) {
            display = typeof display !== 'undefined' ? display : false;
            sketch = typeof sketch !== 'undefined' ? sketch : false;
            for(var key in json) {
                var _ele = json[key];
                var _path = key.split('/');
                var _type = _ele.type;
                if (_type == 'input') {
                    _ele.type = _ele.subtype;
                }
                _ele.id = _ele.id.replace('element-','');
                if (sketch) {
                    _ele.id = 'o' + _ele.id;
                }
                var field = tmpl('tmpl-' + _type, _ele);
                if (display) {
                    if (['input','file','textarea'].indexOf(_type) != -1) {
                        field = tmpl('tmpl-' + _type + '-display', _ele);
                    }
                    if (_type == 'button') {
                        field = "";
                    }
                }
                if (sketch) {
                    field = '<div class="fart-drag ui-draggable ui-draggable-handle" data-name="'+ _type + '" style="width: 100%; height: auto;" data-id="index">' 
                            + field + '<div class="fart-close"><i class="fa fa-times-circle"></i></div></div>';
                }
                var xpath = $(self.element);
                var _base_index = [];
                var _container = tmpl('tmpl-layout-50',{position:'container',id:'container'});
                var _flag = 0;
                _path.filter(function(p) {
                    return $.trim(p) != "";
                }).map(function(p,i) {
                    var _pos = p.split('_');
                    if (['container','left','right'].indexOf(p) != -1 || p.indexOf('element-') != -1) {
                        _pos = [p,0];
                    }
                    // debugger
                    if (_pos[0] == 'index') {
                        // _base_index[i] == undefined ? _base_index[i] = 0 : _base_index[i];
                        _flag = _pos[1] - 1;
                        if (_flag != 0) {
                            if (xpath.find('> :nth-child('+ (_pos[1] - 1) +')').length == 0) {
                                for (var ix = _pos[1] - 1; ix >= 0; ix--) {
                                    xpath.append(_container);
                                }
                            };
                            xpath = xpath.find('> :nth-child('+ (_pos[1] - 1) +')');
                        }
                    }
                    if (p == 'container') {
                        var with_element = xpath.closest('.form-artisian,div[data-id=left],div[data-id=right]').find('div[id=element-c'+ _flag + '-' + i +']')
                        // debugger// var 
                        if (with_element.length == 0) {
                            with_element = tmpl('tmpl-layout-50',{position:'container',id: 'c' + _flag + '-' + i});
                            if (sketch) {
                                with_element = '<div class="fart-drag ui-draggable ui-draggable-handle" data-name="layout-50" style="width: 100%; height: auto;" data-id="index">' 
                                        + with_element + '<div class="fart-close"><i class="fa fa-times-circle"></i></div></div>';
                            }
                            if (_flag == 0) {
                                xpath.append(with_element);
                            }else{
                                xpath.after(with_element);
                            }    
                        }
                        xpath = xpath.closest('.form-artisian,div[data-id=left],div[data-id=right]').find('div[id=element-c'+ _flag + '-' + i +']'); 
                    }
                    // debugger
                    if (p == 'left') {
                        xpath = xpath.find('> div[data-id=left]:first');
                    }
                    if (p == 'right'){
                        xpath = xpath.find('> div[data-id=right]:first');
                    }
                    if (p.indexOf('element-') != -1) {
                        if (_flag == 0) {
                            xpath.append(field);
                        }else{
                            xpath.after(field);
                        }
                    }                  
                });
                if (!display && !sketch) {
                    if (_type == 'file') {
                        // debugger
                        debugger
                        utils.fileuploadInit('#element-' + _ele.id);
                    }
                }
            }
            if (sketch) {
                $(self.element).find('.fart-form-layout-50').sortable({
                                                    placeholder: "drag-style-2",
                                                    connectWith: '.fart-form-layout, .fart-form-layout-50',
                                                    revert: 100,
                                                    cancel: '#save-the-designed-unique-id-is-not-required',
                                                    cursor: 'move'
                                                }).disableSelection();
            }
            $(self.element).find('div[id=element-container]').remove();
        }
    })
    $.extend(Artisian.prototype.design,{
        init: function(self) {
            $(self.element).addClass('form-artisian').addClass('fart-form-layout').data('id','workspace');
            $(self.element).append('<div id="save-the-designed-unique-id-is-not-required"><button class="btn btn-primary">保存</button>' + self.options.designButton + '</div>');
        },
        initUI : function (self) {
            // if (true) {}
            self.design.init(self);
            var default_data = {id:1,label:'标题',
                                desc:'描述',position:'0:0:1',type:'text',
                                filetype:'image',files_number_limit:1,autoupload:'true',
                                required:true,readonly:true};
            var form_layout_sortable_options = {
                placeholder: "drag-style-2",
                connectWith: '.fart-form-layout-50',
                revert: 100,
                cancel: '#save-the-designed-unique-id-is-not-required',
                cursor: 'move'
            };
            var the_sortable = $('.fart-form-layout').sortable(form_layout_sortable_options).disableSelection();
            var the_other_sortable = [];
            $('.fart-drag').draggable({
                connectToSortable: '.fart-form-layout, .fart-form-layout-50',//'.fart-form-layout',
                helper: "clone",
                revert: 'invalid',
                revertDuration: 200,
                drag: function (e, ui) {
                    ui.helper.width("100%");
                },
                stop: function (e,ui) {
                    ui.helper.width("100%").height("auto");
                    ui.helper.removeClass (function (index, className) {
                        return (className.match (/(^|\s)icon-\S+/g) || []).join(' ');
                    });
                    var name = ui.helper.data('name');
                    var i18n = {date:'日期',number:'数字'};
                    if (['date','number'].indexOf(name) != -1) {
                        default_data.type = name;
                        default_data.label = i18n[name];
                        name = 'input';
                    }
                    var ele = tmpl('tmpl-' + name, default_data);
                    ui.helper.html(ele);
                    ui.helper.data('id','index');
                    $('<div class="fart-close"><i class="fa fa-times-circle"></i></div>').appendTo(ui.helper);
                    if (name == 'layout-50') {
                            form_layout_sortable_options.connectWith = '.fart-form-layout, .fart-form-layout-50';
                            the_other_sortable = $('.fart-form-layout-50').sortable(form_layout_sortable_options).disableSelection();
                    }
                    /// re init default value
                    default_data.type = "input";
                    default_data.label = "标题";
                    default_data.id ++;
                }
            });
            self.design.initPopover(self);
            self.design.initBodyEvent(self);
            self.design.initEvent(self);
        },
        initPopover: function (self) {
            $('body').popover({
                selector:'.fart-form-layout .form-element',
                html:true,
                placement:'bottom',
                title:'属性',
                content:function () {
                    
                    var type = $(this).data('type').replace('element-','');
                    var _placeholder = $(this).find('input').attr('placeholder');
                    var _default_data = self.design.fetchData(this);
                        // debugger;
                    var data = {isheader:false,isdesc:false,isfile:false,hasRequired:true,
                                isinput:true,istextarea:false, isdate:false,
                                data:_default_data
                               };

                    if (['header','paragraph','button'].indexOf(type) != -1) {
                        data.hasRequired = false;
                        data.isinput = false;
                    }
                    if (type == 'header') {
                        data.isheader = true;
                    }
                    if (type == 'paragraph') {
                        data.isdesc = true;
                    }
                    if (type == 'textarea') {
                        data.istextarea = true;
                    }
                    if (type == 'input') {
                        if ($(this).find('input[type=date]').length > 0) {
                            data.isdate = true;
                        }
                    }
                    if (type == 'file') {
                        data.isfile = true;
                        data.isinput = false;
                    }
                    return tmpl('tmpl-options',data);
                }
            })
            $(self.element).parent().on('click',function (e) {
                $('.fart-form-layout .form-element').popover('hide');
                $('.fart-form-layout .form-element').popover('dispose');
            });
        },
        initBodyEvent: function (self) {
            $('body').on('hide.bs.popover', '.fart-form-layout .form-element',function () {
                var popover = $('.popover');
                var _return_data = {
                    label: popover.find('input[name=label]').val(),
                    desc: popover.find('input[name=desc]').val(),
                    placeholder: popover.find('input[name=placeholder]').val(),
                    defaultval: popover.find('input[name=default]').val(),
                    required: popover.find('input[name=required]').prop('checked'),
                    rows: popover.find('input[name=rows]').val(),
                    files_number_limit: popover.find('input[name=files_number_limit]').val(),
                    autoupload: popover.find('input[name=autoupload]').prop('checked'),
                    filetype: popover.find('input[name=filetype]:checked').val(),
                };
                // debugger;
                var type = $(this).data('type').replace('element-','');
                $(this).find('span.label-title').html(_return_data.label);
                if (type == 'desc' || type == 'header') {
                    $(this).find('p.description').html(_return_data.desc);
                }
                if (type == 'button') {
                    $(this).find('input').val(_return_data.label);
                }else{
                    $(this).find('input').attr('placeholder',_return_data.placeholder);
                    $(this).find('input').val(_return_data.defaultval);
                }
                
                if (_return_data.required) {
                    $(this).addClass('required');
                }else{
                    $(this).removeClass('required');
                }

                if (type == 'textarea') {
                    $(this).find('textarea').attr('rows',_return_data.rows);
                    $(this).find('textarea').val(_return_data.defaultval);
                    $(this).find('textarea').attr('placeholder',_return_data.placeholder);
                }
                if (type == 'file') {
                    $(this).find('.upload_settings').data('limit',_return_data.files_number_limit),
                    $(this).find('.upload_settings').data('auto',_return_data.autoupload),
                    $(this).find('.upload_settings').data('type',_return_data.filetype);
                }
                
            });
            $('body').on('click','.fart-close',function () {
               $(this).parent().remove();
            });
            $('body').on({
                mouseenter:function () {
                    $(this).find('.fart-close').show();
                },mouseleave:function () {
                    $(this).find('.fart-close').hide();
                }
            },'.fart-drag');
        },
        initEvent: function (self) {
            $('#save-the-designed-unique-id-is-not-required button').on('click',function() {
                var _cal = {};
                
                $('.form-element').each(function(i,e){
                    var _data = self.design.fetchData(e);
                    var _position = utils.getXPath($(e),'workspace');
                   _cal[_position] = _data;
                });
                $.ajax({
                    url: self.options.designSaveUrl,
                    type: 'post',
                    data: _cal,
                    dataType: 'json'
                }).then(
                    function (json) {
                        self.options.designSaveCb(json,_cal);
                    },
                    function (jqXHR, textStatus, errorThrown) {
                        self.options.designSaveErrorCb({jqXHR:jqXHR, textStatus:textStatus, errorThrown:errorThrown},
                                                        _cal);
                    }).catch(function(arg) {

                    });
                
                // debugger
            });

        },
        fetchData: function (e) {
            var _data = {
                    type: $(e).data('type').replace('element-',''),
                    subtype: $(e).find('input').attr('type'),
                    id: $(e).attr('id'),
                    label: $(e).find('input[type=submit]').length == 0 ? $(e).find('span.label-title').html() : $(e).find('input[type=submit]').val() ,
                    desc: $(e).find('p.description').html(),
                    placeholder: $(e).find('textarea').length == 0 ? $(e).find('input').attr('placeholder') : $(this).find('textarea').attr('placeholder') ,
                    defaultval: $(e).find('textarea').length == 0 ? $(e).find('input').val() : $(this).find('textarea').val(),
                    required: $(e).hasClass('required'),
                    rows: $(e).find('textarea').attr('rows'),
                    files_number_limit: $(e).find('.upload_settings').data('limit'),
                    autoupload: $(e).find('.upload_settings').data('auto'),
                    filetype:$(e).find('.upload_settings').data('type')
            };
            for(var key in _data) {
                if (_data[key] == undefined) {
                    delete _data[key];
                }
            }
            return _data;
        }
    });

    var utils = {
        relative_path : function () {
            var jsfiles = document.scripts;
            var relative_path = jsfiles[jsfiles.length - 2].src;
            return relative_path.substring(0, relative_path.lastIndexOf('/')) + '/';
        },
        position: function (ele) {
            var base = $('.fart-form-layout').offset();
            var cal = $(ele).offset();
            return {top: cal.top - base.top, left: cal.left - base.left, width: $(ele).width()};
        },
        outerHTML : function() {
          return $('<div />').append(this.eq(0).clone()).html();
        },
        getXPath : function(self,rootNodeName){
                //other nodes may have the same XPath but because this function is used to determine the corresponding input name of a data node, index is not included 
                var position,
                    $node = self.first(),
                    nodeName = utils.getDefaultTest($node),
                    $sibSameNameAndSelf = $node.siblings().addBack(),
                    steps = [], 
                    $parent = $node.parent(),
                    parentName = utils.getDefaultTest($parent);

                // position = ($sibSameNameAndSelf.length > 1) ? '.'+($sibSameNameAndSelf.index($node)+1) : '.1';
                // steps.push(nodeName+position);
                steps.push(nodeName);
                while ($parent.length == 1 && parentName !== rootNodeName && parentName !== '#document'){
                    $sibSameNameAndSelf = $parent.siblings().addBack();
                    position = ($sibSameNameAndSelf.length > 1) ? '_'+ ($sibSameNameAndSelf.index($parent)+1)  : '_1';
                    if (['container','left','right'].indexOf(parentName) != -1) {
                        steps.push(parentName);    
                    }else{
                        steps.push(parentName+position);
                    }
                    $parent = $parent.parent();
                    parentName = utils.getDefaultTest($parent);
                }
                return '/'+steps.reverse().join('/');
        },
        getDefaultTest : function (e) {
            return e.data('id') == undefined ? (e.attr('id') == undefined ? e.prop('nodeName') : e.attr('id'))  : e.data('id');
        },
        fileuploadInit: function (e) {
            var $t = $(e).find('.upload_settings');
            var config = {
              url: $t.data('url'),
              dataType: 'json',
              sequentialUploads:true,
              disableImageResize: /Android(?!.*Chrome)|Opera/
                  .test(window.navigator && navigator.userAgent),
              imageCrop: true // Force cropped images
            };
            if ($t.data('limit')) {
                config['maxNumberOfFiles'] = parseInt($t.data('limit'));
            }
            if ($t.data('auto') &&  $t.data('auto') != 'false') {
                config['autoUpload'] = true;
            }
            if ($t.data('type') == 'image') {
                config['acceptFileTypes'] = /(\.|\/)(gif|jpe?g|png)$/i;   
            }
            debugger
            $(e).fileupload(config);
        }
    };
    
}(jQuery));