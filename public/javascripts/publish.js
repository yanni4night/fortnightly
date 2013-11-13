/**
 * publish.js
 *
 * @author yinyong#sogou-inc.com
 * @date Tue Nov 12 2013 21:22:07 GMT+0800 (CST)
 * @version 0.0.1
 */
void

function() {
    var APP = {
        init: function() {
            this.collectArticlesPool=$(".ctrl-panel select:eq(1)");
            this.allArticlesPool=$(".ctrl-panel select:eq(0)");
            this.initEvent();
        },
        initEvent: function() {
            var self=this;
            $(".ctrl-panel .ctrl button:eq(0)").click(function(e) {

                var items=self.collectArticlesPool.find("option:selected");
                console.log(items);

            });
            $(".ctrl-panel .ctrl button:eq(1)").click(function(e) {

                var items=self.allArticlesPool.find("option:selected");
                items.remove();
                self.collectArticlesPool.append(items);

            });
        },
        collectArticle: function(id) {},
        uncollectArticle: function(id) {}
    };
    APP.init();
}();