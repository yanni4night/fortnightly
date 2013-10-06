/**
 * list.js
 * Copyright(C) Sogou.com UFO
 *
 * @Author:yinyong@sogou-inc.com
 * @Date:Tue Aug 27 2013 19:49:37 GMT+0800 (CST)
 * @Version:0.0.1
 */

void
function() {
    var APP = {
        init: function() {
            $(".rm").click(function(e) {
                var tid = $(this).data("tid");
                if (!/^[a-z0-9]{24}$/i.test(tid)) {
                    return bootbox.alert("ID not valid!");
                }

                bootbox.confirm("", function(result) {
                    if (!result) return;
                    $.ajax({
                        url: "/template/remove",
                        type: "post",
                        dataType: "json",
                        data: {
                            tid: tid
                        },
                        success: function(data) {
                            if (+data.result) {
                                $('#tem-' + tid).remove();
                            } else {
                                bootbox.alert(data.msg);
                            }
                        },
                        error: function(xhr, error) {
                            bootbox.alert(error);
                        }
                    }); //ajax
                });



            });
        }
    };
    APP.init();
}();