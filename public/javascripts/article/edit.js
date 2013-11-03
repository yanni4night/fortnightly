/**
 * UFO Fortnightly ,modify an article
 * @Copyright(C) Sogou.com UFO
 * @Author:yinyong#sogou-inc.com
 * @Date:Fri Aug 24 2013 09:56:22 GMT+0800 (CST)
 * @version:0.0.1
 */
void

function() {
    var APP = {
        init: function() {

            if (typeof article == "undefined") return;

            $("#title").val(article.title||"");
            $("#origin").val(article.origin||"");
            $('#editor_id').val(article.content||"");
            $('#_id').val(article._id);
            $('#editorType').val(article.editorType);

            article.tags.forEach(function(t) {
                $("#tagit").append("<li>" + t + "</li>");
            });

            $('#tagit').tagit();

            if (/^html$/i.test(article.editorType)) {
                $.getScript('/javascripts/kindeditor-min.js', function() {
                    KindEditor.ready(function(K) {
                        window.editor = K.create('#editor_id',{
                            themesPath:"/javascripts/themes/",
                            langPath:"/javascripts/lang/"
                        });
                    });
                });
            } else {
                $("#editor-wrapper").append('<div id="epiceditor"></div>');
                $('#editor_id').hide();
                $.getScript('/javascripts/epiceditor.min.js', function() {
                    window.editor = new EpicEditor({
                        textarea: "editor_id",
                        basePath: '/',
                        theme: {
                            base: 'stylesheets/themes/base/epiceditor.css',
                            preview: 'stylesheets/themes/preview/preview-dark.css',
                            editor: 'stylesheets/themes/editor/epic-dark.css'
                        },
                        autogrow: true,
                        clientSideStorage: false
                    }).load();
                });
            }

            $('#saveBtn').click(function(e) {
                var content = ('markdown' === article.editorType) ? window.editor.exportFile() /*markdown*/ : window.editor.html() /*html*/ ;
                var summary = (('markdown' === article.editorType) ? window.editor.exportFile(null, 'html') : content).replace(/<.*?>/g, '').replace(/\s{2,}/g, ' ');
                var title = $('#title');

                $('input[name=content]').val(content);
                $('input[name=summary]').val(summary);
                $('input[name=editorType]').val(article.editorType);

                $.ajax({
                    url: "/article/update",
                    type: 'post',
                    dataType: 'json',
                    data: $('#form').serialize(),
                    success: function(data) {
                        if (data.result === 1) {
                            bootbox.alert("Save successfully", function() {
                                location.assign("/article/read/" + data.id);
                            });
                        } else {
                            bootbox.alert(data.msg);
                        }
                    },
                    error: function(xhr, error) {
                        bootbox.alert(error);
                    }
                });

            });
        }
    };


    APP.init();
}();