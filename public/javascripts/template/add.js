/**
 * add.js
 * Copyright(C) Sogou.com UFO
 *
 * @Author:yinyong#sogou-inc.com
 * @Date:Sun Aug 25 2013 17:10:59 GMT+0800 (CST)
 * @Version:0.0.1
 */

void
function() {
    var APP = {
        init: function() {

            if (typeof template != "undefined") {
                $("#name").val(template.name || "");
                $("#editor_id").val(template.content || "");
                $("#hidden-id").val(template._id || "");
            }

            var url = location.search;
            if (/e=html/i.test(url)) {
                //HTML editor
                $('#switchEditor').attr('href', location.href.replace(location.search, "")).text('Switch to plain editor');
                $.getScript('/javascripts/kindeditor-min.js', function() {
                    KindEditor.ready(function(K) {
                        window.editor = K.create('#editor_id', {
                            themesPath: "/javascripts/themes/",
                            langPath: "/javascripts/lang/"
                        });
                    });
                });

                var htmlMode = true;
            } else {
                $('#switchEditor').attr('href', location.href.replace(location.search, "") + "?e=html").text('Switch to rich editor');
            }



            $('#submit').click(function(e) {
                var name = $('#name').val().trim();
                var content = (typeof htmlMode != 'undefined') ? window.editor.html() : $('#editor_id').val().trim();
                if (!name || !content) {
                    return $('#errMsg').text("Lack of input!").show();
                }
                $("#hidden-content").val(content);
                $.ajax({
                    url: "/template/save",
                    type: "post",
                    dataType: "json",
                    data: $("#form").serialize(),
                    success: function(data) {
                        if (data.result) {
                            location.assign("/template/list");
                        } else {
                            $('#errMsg').text(data.msg || "Unknown error(s)").show();
                        }
                    },
                    error: function(xhr, error) {
                        $('#errMsg').text(error).show();
                    }
                });
            });
        }
    };

    APP.init();
}();