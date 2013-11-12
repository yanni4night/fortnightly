/**
 * past.js=>publish.js
 * create new&show past published fortnightly
 *
 * changelog
 * 2013-11-03:create
 * 2013-11-12:change to publish;show publish page
 *
 * @author yinyong#sogou-inc.com
 * @date  Sun Nov 03 2013 20:44:10 GMT+0800 (CST)
 * @version 0.0.2
 */

var util = require('util');
var config = require('../config');
var Model = require('../Model');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;

//Models
var Publish = new Model('publish');
var Article = new Model('article');
var Template = new Model('template');

module.exports = {
    /**
     * [read description]
     * @param  {Request} req
     * @param  {Response} res
     */
    read: function(req, res) {
        var _id = res.param('id');
        if (!/^[a-z0-9]{24}$/.test(_id)) {
            return res.render("error", {
                errMsg: "Lack of id"
            });
        }
        return Publish.find({
            _id: ObjectId(_id)
        }, {}, function(err, published) {
            if (err || !util.isArray(published) || published.length !== 1) {
                return req.render("error", {
                    errMsg: err
                });
            } else {
                return res.render("past-read", {
                    published: published,
                    page: "past"
                });
            }
        });
    },
    /**
     * Show articles&templates,render a mail.
     * @param  {Request} req
     * @param  {Response} res
     */
    publish: function(req, res) {
        //Here we need read all the articles in pages&all templates
        var articles = collection = tpls = [];
        var inQ = [];
        (req.session.collection || []).forEach(function(item, index) {
            inQ.push(ObjectId(item));
        });
        return async.series([
            //Read all articles
            function(callback) {
                return Article.find({
                    _id: {
                        $nin: inQ
                    }
                }, {}, function(err, _articles) {
                    articles = _articles;
                    callback(err);
                });
            },
            //Read all tpls
            function(callback) {
                return Template.find({}, {}, function(err, _tpls) {
                    tpls = _tpls;
                    callback(err);
                });
            },
            //Read collection articles
            function(callback) {

                return Article.find({
                    _id: {
                        $in: inQ
                    }
                }, {}, function(err, _articles) {
                    collection = _articles;
                    callback(err);
                });
            }

        ], function(err, data) {
            if (err) {
                return res.render('error', {
                    errmsg: err
                });
            } else {
                return res.render('publish', {
                    tpls: tpls,
                    articles: articles,
                    collection: collection,
                    pageType: 'publish'
                });
            }
        }); //async
    },

    /**
     * [save description]
     * @param  {[type]} content
     * @return {[type]}
     */
    save: function(content) {
        return Publish.save({
            content: content,
            createTime: Date.now()
        }, function(err) {

        });
    },
    /**
     * [list description]
     * @param  {Request} req
     * @param  {Response} res
     */
    list: function(req, res) {
        return Publish.find({}, {}, function(err, published) {
            if (err || !util.isArray(published)) {
                return req.render("error", {
                    errMsg: err
                });
            } else {
                return res.render("past-list", {
                    published: published,
                    page: "publish"
                });
            }
        });
    }
};