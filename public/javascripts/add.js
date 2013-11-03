/**
 * UFO Fortnightly ,add an article
 * @Copyright(C) Sogou.com UFO
 * @Author:yinyong#sogou-inc.com
 * @Date:Fri Aug 23 2013 19:29:17 GMT+0800 (CST)
 * @version:0.0.1
 */
void
function() {

    var APP = {
        init: function() {
            var url = location.href;
            var editorMode;
            //Switch editor
            if (/\?e=markdown/i.test(url)) {

                editorMode = 'markdown';

                $("#editor-wrapper").append('<div id="epiceditor"></div>');
                $('#switchEditor').text('Switch to  HTML editor').attr('href', '/article/add');

                $.getScript('/javascripts/epiceditor.min.js', function() {
                    window.editor = new EpicEditor({
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

            } else {

                editorMode = 'html';

                $("#editor-wrapper").append('<textarea class="form-control" rows="20" id="editor_id"></textarea>');
                $('#switchEditor').text('Switch to Markdown editor').attr('href', '/article/add?e=markdown');

                $.getScript('/javascripts/kindeditor-min.js', function() {
                    KindEditor.ready(function(K) {
                        window.editor = K.create('#editor_id',{
                            themesPath:"/javascripts/themes/",
                            langPath:"/javascripts/lang/"
                        });
                    });
                });
            }

            $('#saveBtn').click(function(e) {
                var content = ('markdown' === editorMode) ? window.editor.exportFile()/*markdown*/: window.editor.html()/*html*/;
                var summary = ('markdown' === editorMode) ?window.editor.exportFile(null,'html').replace(/<.*?>/g, '').replace(/\s{2,}/g, ' '):window.editor.text();
                var title=$('#title');

                $('input[name=content]').val(content);
                $('input[name=summary]').val(summary);
                $('input[name=editorType]').val(editorMode);

                $.ajax({
                    url: "/article/save",
                    type: 'post',
                    dataType:'json',
                    data: $('#form').serialize(),
                    success: function(data) {
                        if(data.result===1)
                        {
                         bootbox.alert("Add successfully",function(){   location.assign("/article/list");});
                        }else{
                            bootbox.alert(data.msg||"Unknown error(s)");
                        }
                    },
                    error: function(xhr, error) {
                       bootbox.alert(error);
                    }
                });

            });

            $('#tagit').tagit();

        }
    };

    APP.init();

}();