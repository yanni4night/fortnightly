/**
 * list.js
 * Copyright(C) Sogou.com UFO
 *
 * @Author:yinyong#sogou-inc.com
 * @Date:Sun Aug 25 2013 11:45:07 GMT+0800 (CST)
 * @Version:0.0.1
 */

void

function() {
    var settings = {
        //height of sphere container
        height: 300,
        //width of sphere container
        width: 300,
        //radius of sphere
        radius: 150,
        //rotation speed
        speed: 1,
        //sphere rotations slower
        slower: 0.9,
        //delay between update position
        timer: 10,
        //dependence of a font size on axis Z
        fontMultiplier: 15,
        //tag css stylies on mouse over
        hoverStyle: {
            border: 'none',
            color: '#0b2e6f'
        },
        //tag css stylies on mouse out
        mouseOutStyle: {
            border: '',
            color: ''
        }
    };
    $('#tagcloud').tagoSphere(settings);

    var paginationUl=$(".pagination");
    (paginationUl.length)&&paginationUl.pagination({
        currentPage:+paginationUl.data("currentpage"),
        pages:+paginationUl.data("totalpages"),
        cssStyle:"compact-theme",
        onPageClick:function(page,evt){
            window.location=paginationUl.data("urlprefix")+String(page)
        }
    });

    //For remove article from my collection
    $(".rm").click(function(e) {
        var aid = $(this).attr("data-aid");
        if (!/^[a-z0-9]{24}$/i.test(aid)) {
            return bootbox.alert("ID not valid!");
        }

        (typeof bootbox !== 'undefined') && bootbox.confirm("R u sure to uncollect?", function(result) {
            if(!result)return;
            
            $.ajax({
                url: "/article/uncollect",
                type: "post",
                dataType: "json",
                data: {
                    id: aid
                },
                success: function(data) {
                    if (+data.result) {
                        $('#tem-' + aid).remove();
                        $('#menu-collection').text("Collections(" + data.count + ")");
                        if (!data.count) {
                            $("#alertmsg").removeClass('alert-success').addClass('alert-warning').html('No article(s) collected,you could <a href="/article/list">collect one or more</a>');
                        }
                    } else {
                        bootbox.alert(data.msg||"failed");
                    }
                },
                error: function(xhr, error) {
                    bootbox.alert(error);
                }
            });//ajax
        });//confirm
    });
}();