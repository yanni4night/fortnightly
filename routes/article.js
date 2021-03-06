/**
 * Article controller.
 * Copyright(C) Sogou.com UFO
 *
 * changelog
 * 2013/11/03:sort articles by create time desc
 * 
 * @author yinyong@sogou-inc.com
 * @date Fri Aug 23 2013 22:05:52 GMT+0800 (CST)
 * @version 0.0.2
 */

var util=require('util');
var config=require('../config');
var Model = require('../Model');
var ObjectId = require('mongodb').ObjectID;
var markdown = require("markdown").markdown;
var readability = require('node-readability');

//article collection
var Article = new Model('article');
//define the max count article items a page shows.
var PAGEITEMS = config.articlePageNum;
//define the max count of collection items a user can take.
var MAXCOLLECTIONITEMS = config.maxCollectionNum;

var ArticleModule = {
    /**
     * Show the page for creating a new article.
     * @param {Request} req 
     * @param {Response} res 
     */
    add: function(req, res) {
        return res.render('article-edit', {
            title: 'Add a article',
            pageType: "add"
        });
    },
    /**
     * Save a new article[AJAX][POST].
     * @param  {Request} req 
     * @param  {Response} res 
     */
    save: function(req, res) {
        var title = req.body.title;
        var content = req.body.content;
        var summary = req.body.summary;
        var origin = req.body.origin||""; //todo:validate url

        var tags = req.body.tags;
        if (!title || !content || !summary) {
            return res.json({
                result: 0,
                msg: "Lack of parameter(s)"
            });
        }

        //Lowercase
        if (util.isArray(tags)) {
            tags.forEach(function(tag, index) {
                tags[index] = String(tag).toLowerCase();
            });
        }else
        {
            tags=[];
        }

        return Article.save({
            title: title,
            content: content,
            summary: summary,
            tags: tags,
            origin: origin,
            createTime: Date.now(), //nightyin:save creating time
            editorType: /^(markdown|html)$/i.test(req.body.editorType) ? req.body.editorType : "HTML" //or markdown or html
        }, function(err, msg) {
            return res.json({
                result: err ? 0 : 1,
                msg: err ? String(err) : "success"
            })
        });
    },
    /**
     * Find an article and pust it in the editing page.
     * @param  {Request} req 
     * @param  {Response} res 
     */
    edit: function(req, res) {
        if (typeof req.params['id'] === 'undefined') {
            return res.render('error', {
                errmsg: "No id specified!"
            });
        }
        //validate id
        if (!/^[a-z0-9]{24}$/i.test(req.params['id'])) {
            return res.render('error', {
                errmsg: "wrong id"
            });
        }

        return Article.find({
            _id: ObjectId(req.params['id'])
        } /*selector*/ , {} /*options*/ , function(err, result) {
            //result should be an array whoes length eq 1
            if (err || !result.length) {
                return res.render('error', {
                    errmsg: err || "Something is wrong!"
                });
            } else {
                var article = result[0];
                if (typeof article.tags === 'string' || (article.tags && (article.tags.constructor == String)))
                    article.tags = [article.tags]; //Wrap string in array

                return res.render('article-edit', {
                    article: JSON.stringify(article),
                    title: "Update article",
                    pageType: 'update',
                    escape: function(d) {
                        return d
                    }
                });
            }
        });
    },
    /**
     * Update an article.Need an _id parameter[AJAX][POST].
     * @param  {Request} req 
     * @param  {Response} res 
     * @todo Merge with add operation.
     */
    update: function(req, res) {
        var title = req.body.title;
        var content = req.body.content;
        var summary = req.body.summary;
        var tags = req.body.tags;
        var origin = req.body.origin||""; //todo:validate
        var _id = req.body._id;
        if (!_id || !title || !content || !summary) {
            return res.json({
                result: 0,
                msg: "Lack of parameter(s)"
            });
        }

        if (!/^[a-z0-9]{24}$/i.test(_id)) {
            return res.json({
                result: 0,
                msg: "wrong id"
            });
        }

        //Lowercase
        if (util.isArray(tags)) {
            tags.forEach(function(tag, index) {
                tags[index] = String(tag).toLowerCase();
            });
        }else tags=[];

        return Article.update({
            _id: ObjectId(_id)
        } /*selector*/ , {
            $set: {
                title: title,
                content: content,
                summary: summary,
                tags: tags,
                origin: origin,
                updateTime: Date.now(), //nightyin:save updating time
                editorType: /^(markdown|html)$/i.test(req.body.editorType) ? req.body.editorType : "HTML" //or markdown or html
            }
        } /*options*/ , function(err, result) {
            if (err) {
                return res.json({
                    result: 0,
                    msg: 'Update failed'
                });
            } else {
                return res.json({
                    result: 1,
                    msg: 'Update succeed',
                    id: _id
                });
            }
        });
    },
    /**
     * Show search result.Need a key and a page[GET].
     * This will search tags,title and summary.
     *
     * @param  {Request} req 
     * @param  {Response} res 
     */
    search: function(req, res) {
        var key = req.param('key');
        if (!key) {
            return res.render("error", {
                errmsg: "No search key!"
            });
        }

        key = decodeURIComponent(key);

        //Convert to Regexp pattern
        var re = key.replace(/\s+/g, "\\s+").replace(/([\(\)\[\]\{\}\^\$\.\\\*\?\+])/g, '\\$1');
        //Build regexp.
        var reg = new RegExp(re, 'img');

        return ArticleModule._query(req, res, {
            $or: [{
                summary: reg
            }, {
                title: reg
            }, {
                tags: reg
            }, {
                origin: reg
            }]
        }, {
            title: "Search for '" + key + "'",
            alertMsg: "Search for '" + key + "':",
            searchKey: key,
            urlPrefix: "/article/search/" + encodeURIComponent(key) + "/" //search/:key/:page
        });
    },
    /**
     * Collect article to session.Need article id[ALL].
     * @param  {Request} req 
     * @param  {Response} res 
     */
    collect: function(req, res) {
        var id = req.param("id");
        var duplicated = false;
        var added_id=[];

        //req.session.collection MUST be an array
        if (!util.isArray(req.session.collection)) {
            req.session.collection = [];
        }

        var ids=id.split('|');//2013/11/13 10:28:50 support multiple ids
        ids.forEach(function(_id,i){
            if(!/^[a-z0-9]{24}$/i.test(_id)){
                //ids.splice(i,1);//remove illegal id
                return;
            }
            //Ignore duplicated
            if(req.session.collection.some(function(it,index){return it==_id})){
                return;
            }

            if(req.session.length>=MAXCOLLECTIONITEMS)
            {
                return;
            }

            req.session.collection.push(_id);
            added_id.push(_id);
        });

        //Really save to session
        req.session.save();

        return res.json({
            result: added_id.length?1:0,
            count: req.session.collection.length,
            ids:added_id.join('|'),
            msg: added_id.length?"Collect succeed":"Cannot collect any"
        });
    },
    /**
     * Uncollect an article.Need a id[AJAX][POST].
     * @param  {Request} req 
     * @param  {Response} res 
     */
    uncollect: function(req, res) {
        var id = req.param("id");

        var ids=id.split('|');
        var removed_ids=[];

         if (!util.isArray(req.session.collection)){
            req.session.collection=[];
         }

        ids.forEach(function(_id,i){
            //Check illegal
            if (!/^[a-z0-9]{24}$/i.test(_id)){
                return;
            }

            req.session.collection.forEach(function(it,index){
                if(it==_id)
                {
                    removed_ids.push(_id);
                    req.session.collection.splice(index,1);
                }
            });

        });

        return res.json({
            result:1,
            msg:"Removed succeed",
            ids:removed_ids.join('|'),
            count:req.session.collection.length
        });
    },
    /**
     * Show collection.Need session.
     * @param  {Request} req 
     * @param  {Response} res 
     */
    collection: function(req, res) {
        if (!req.session.collection)
            return res.render("collection-list", {
                title: "No collection",
                currentPage: 0,
                pageType: 'collection',
                totalPages: 0,
                data: []
            });

        var inQ = [];
        req.session.collection.forEach(function(item, index) {
            inQ.push(ObjectId(item));
        });

        return ArticleModule._query(req, res, {
            _id: {
                $in: inQ
            }
        }, {
            title: "My collections",
            pageType: 'collection',
            alertMsg: "My collections:",
            urlPrefix: "/article/collection/",
            template: "collection-list"
        });
    },
    /**
     * Query by tag.Need a tag and a page[GET].
     * @param  {Request} req 
     * @param  {Response} res 
     */
    tags: function(req, res) {
        var tag = req.param('tag');
        if (!tag) {
            return res.render("error", {
                errmsg: "No tag found"
            }); //res.redirect('/article/list');
        }

        tag = decodeURIComponent(tag);

        var re = tag.replace(/\s+/g, "\\s+").replace(/([\(\)\[\]\{\}\^\$\.\\\*\?\+])/g, '\\$1');

        var reg = new RegExp("^" + re + "$", 'img');

        return ArticleModule._query(req, res, {
            tags: reg
        }, {
            title: 'Search for tag "' + tag + '"',
            alertMsg: "Search for tag '" + tag + "'",
            urlPrefix: "/article/tags/" + encodeURIComponent(tag) + "/"
        });
    },
    /**
     * Common query and list.Private function.It outputs a tag cloud.
     * @param  {Request} req           
     * @param  {Response} res           
     * @param  {Object} selector      
     * @param  {Object} renderOptions 
     */
    _query: function(req, res, selector, renderOptions) {

        //Show collections count.
        if (req.session.collection) {
            renderOptions.hasCollection = req.session.collection.length;
        }

        //Get page which has to be gt 0.
        var page = +req.param('page') || 1;
        if (page < 1) page = 1;

        var self = this;
        renderOptions = renderOptions || {};
        //Count first
        return Article.count(selector /*selector*/ , {}, function(err, cnt) {
            if (err) {
                return res.render('error', {
                    errmsg: err
                });
            } else {
                //Give an opportunity to change item count on a page.
                var itemsEachPage = renderOptions.pageItems || PAGEITEMS;
                var totalPages = Math.ceil((+cnt) / itemsEachPage);
                if (page > totalPages) page = totalPages;
                if (!totalPages) {
                    renderOptions.currentPage = 0;
                    renderOptions.totalPages = 0;
                    renderOptions.data = [];
                    renderOptions.escape = function(d) {
                        return d; //Do not escape
                    };
                    return res.render(renderOptions.template || 'article-list', renderOptions);
                }
                //Now real
                return Article.find(selector /*selector*/ , {
                    skip: (page - 1) * itemsEachPage,
                    limit: itemsEachPage,
                    sort: {
                        createTime: 1
                    },
                    fields: {
                        content: 0,
                        tags: 0
                    }
                } /*options*/ , function(err, result) {
                    //result will be an array
                    if (err) {
                        return res.render('error', {
                            errmsg: err || "Something is wrong!"
                        });
                    } else {

                        var tagResultRender = {};
                        var totalTags = 0;
                        var skip = 0;

                        //Recursive

                        function queryTags() {
                            return Article.find({}, {
                                sort: {
                                    'tags': 1
                                },
                                skip: skip,
                                fields: {
                                    tags: 1
                                },
                                limit: 100
                            }, function(err, tagResult) {
                                //max
                                if (err || totalTags > 100 || !tagResult.length) {
                                    return renderTemplate();
                                }

                                skip += tagResult.length;

                                for (var e in tagResult) {
                                    var t = tagResult[e].tags;
                                    if (typeof t == 'string' || t.constructor == String) {
                                        tagResultRender[t] = (undefined === tagResultRender[t]) ? 1 : tagResultRender[t] + 1;
                                        ++totalTags;
                                    } else if (util.isArray(t)) {
                                        t.forEach(function(item) {
                                            tagResultRender[item] = (undefined === tagResultRender[item]) ? 1 : tagResultRender[item] + 1;
                                        });
                                        totalTags += t.length;
                                    }
                                } //for(var e in tagResult)

                                queryTags();

                            });
                        } //queryTags

                        //Now I'll query tags

                        function renderTemplate() {
                            renderOptions.currentPage = page;
                            renderOptions.totalPages = totalPages;
                            renderOptions.data = result.reverse();
                            renderOptions.tagcloud = tagResultRender;
                            renderOptions.escape = function(d) {
                                return d; //Do not escape
                            };
                            return res.render(renderOptions.template || 'article-list', renderOptions);
                        } //renderTemplate

                        queryTags();
                    }
                }); //Article find

            }
        }); //Article count
    },
    /**
     * List 10 articles at most.Need a page parameter[GET].
     * @param  {Request} req 
     * @param  {Response} res 
     */
    list: function(req, res) {
        return ArticleModule._query(req, res, {}, {
            title: 'List all articles',
            pageType: 'all',
            alertMsg: "All articles:",
            urlPrefix: "/article/list/"
        });
    },
    /**
     * Show an article in HTML.Need an id parameter[GET].
     * @param  {Request} req 
     * @param  {Response} res 
     */
    read: function(req, res) {
        if (typeof req.params['id'] === 'undefined')
            return res.render("error", {
                errmsg: "No ID found!"
            });

        if (!/^[a-z0-9]{24}$/.test(req.params['id'])) {
            return res.render('error', {
                errmsg: "wrong id"
            });
        }

        return Article.find({
            _id: ObjectId(req.params['id'])
        } /*selector*/ , {} /*options*/ , function(err, result) {
            if (err || !result.length) {
                return res.render('error', {
                    errmsg: err || "Something is wrong!"
                });
            } else {
                if (/markdown/i.test(result[0].editorType))
                    result[0]['content'] = markdown.toHTML(result[0]['content']); //Markdown,then convert to HTML.

                return res.render('article-read', {
                    data: result[0],
                    pageType: "read",
                    hasCollection: (req.session.collection && req.session.collection.constructor == Array) ? req.session.collection.length : 0,
                    escape: function(d) {
                        return d; //Do not escape
                    }
                });
            }
        });
    }, //read
    /**
     * [addgrab description]
     * @param  {Request} req 
     * @param  {Response} res 
     */
    addGrab: function(req, res) {
        var url = req.query.url || "";
        var title = req.query.title || "";
        return res.render('grab', {
            url: url,
            title: title
        });
    },
    /**
     * [grabUrl description]
     * @param  {Request} req 
     * @param  {Response} res 
     */
    grabUrl: function(req, res) {
        var title = req.body.title;
        var url = req.body.url;
        var tags = req.body.tags;

        if (!title || !url) {
            return res.json({
                result: 0,
                msg: "Lack of parameter(s)"
            });
        }

        //Lowercase
        if (util.isArray(tags)){
            tags.forEach(function(tag, index) {
                tags[index] = String(tag).toLowerCase();
            });
        }

        return readability(url, function(err, article) {
            if (err) {
                return res.json({
                    result: 0,
                    msg: String(err)
                });
            }

            var content = article.content||"";
            //nightyin:stupid way
            var summary = (content || "Nothing").replace(/<\/?\w+\s?[\s\S]*?>/img, '');

            return Article.save({
                title: title,
                content: content,
                summary: summary,
                tags: tags || "",
                createTime: Date.now(), //nightyin:save creating time
                origin: url, //2013/11/1-save origin url
                editorType: "HTML"
            }, function(err, ret) {
                return res.json({
                    result: err ? 0 : 1,
                    msg: err ? String(err) : "success",
                    url: "/article/read/" + ret[0]._id
                })
            });
        }); //read
    }
};

module.exports = ArticleModule;