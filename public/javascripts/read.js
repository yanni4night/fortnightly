/**
 * read.js
 * Copyright(C) Sogou.com UFO
 *
 * @Author:yinyong@sogou-inc.com
 * @Date:Sat Aug 24 2013 23:52:00 GMT+0800 (CST)
 * @Version:0.0.1
 */

void
function() {
    $(".collect").click(function(e) {
        var id = $(this).data('aid');
        var collect = $(this).data('collect');
        if (+collect) return;

        var self = $(this);

        $.ajax({
            url: "/article/collect",
            type: "POST",
            dataType: "json",
            // contentType:"application/json",
            data: {
                id: id
            },
            success: function(data) {
                if (+data.result === 1) {
                    self.addClass('disabled').data("collect", 0).text("Collected");
                    $('#menu-collection').text("Collections(" + data.count + ")");
                }else
                {
                    bootbox.alert(data.msg);
                }
            },
            error: function() {
                bootbox.alert("error");
            }
        });

    });
}();