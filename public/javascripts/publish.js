/**
 * publish.js
 *
 * @author yinyong#sogou-inc.com
 * @date Tue Nov 12 2013 21:22:07 GMT+0800 (CST)
 * @version 0.0.2
 */
void

function() {
    var APP = {
        /**
         * [init description]
         * @return {[type]} [description]
         */
        init: function() {
            this.$collectArticlesPool = $(".ctrl-panel select:eq(1)");
            this.$allArticlesPool = $(".ctrl-panel select:eq(0)");
            this.$collectBtn=$(".ctrl-panel .ctrl button:eq(0)");
            this.$uncollectBtn=$(".ctrl-panel .ctrl button:eq(1)");
            this.$renderBtn=$("button.render");
            this.$previewIframe=$("iframe.preview");
            this.initEvent();
        },
        /**
         * [initEvent description]
         * @return {[type]} [description]
         */
        initEvent: function() {
            var self = this;
            self.$collectBtn.click(function(e) {

                var $items = self.$allArticlesPool.find("option:selected");
                var ids = [];
                $.each($items, function(index, item) {
                    ids.push($(item).val());
                });

                self.collectArticle(ids);

            });
            self.$uncollectBtn.click(function(e) {

                var $items = self.$collectArticlesPool.find("option:selected");
                var ids = [];
                $.each($items, function(index, item) {
                    ids.push($(item).val());
                });

                self.uncollectArticle(ids);
            });

            self.$renderBtn.click(function(e){
                if(self.$collectArticlesPool.find("option:selected").length)
                self.$previewIframe.attr('src',"/template/use/"+$('select.tpls').val()+"?="+Date.now());
            });

        },
        /**
         * [collectArticle description]
         * @param  {[type]} ids [description]
         * @return {[type]}     [description]
         */
        collectArticle: function(ids) {
            var self = this;
            self.commonCollect(ids, {
                url: "/article/collect",
                success: function(data) {
                    var ids = (data.ids || "").split('|');
                    ids.forEach(function(item, index) {
                        var i = self.$allArticlesPool.find('[value=' + item + ']');
                        i.remove();
                        self.$collectArticlesPool.append(i);
                    });
                }
            });
        },
        /**
         * [collectArticle description]
         * @param  {[type]} ids [description]
         * @return {[type]}     [description]
         */
        commonCollect: function(ids, options) {
            var self = this;
            if (self.transfering) return;
            $.ajax({
                url: options.url,
                type: 'post',
                data: {
                    id: $.isArray(ids) ? ids.join('|') : ids
                },
                beforeSend: function() {
                    self.transfering = true;
                },
                complete: function() {
                    self.transfering = false;
                }
            }).done(function(data) {
                if (+data.result) {
                    options.success.apply(self, arguments);
                } else
                    bootbox.alert(data.msg || "failed", function() {});
            }).fail(function(xhr, error) {
                bootbox.alert(error, function() {});
            });
        },
        /**
         * [uncollectArticle description]
         * @param  {[type]} ids [description]
         * @return {[type]}     [description]
         */
        uncollectArticle: function(ids) {
            var self=this;
            self.commonCollect(ids, {
                url: "/article/uncollect",
                success: function(data) {
                    var ids = (data.ids || "").split('|');
                    ids.forEach(function(item, index) {
                        var i = self.$collectArticlesPool.find('[value=' + item + ']');
                        i.remove();
                        self.$allArticlesPool.append(i);
                    });
                }
            });
        }
    };
    APP.init();
}();