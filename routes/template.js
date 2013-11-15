/**
 * Template controller.
 * Template+Articles=Page(Email)
 * Copyright(C) Sogou.com UFO
 *
 * changelog
 * 2013/11/03:sort tempalte by create/update time;repalced Ursa  with ejs.
 * 
 * @Author:yinyong#sogou-inc.com
 * @Date:Sun Aug 25 2013 15:13:42 GMT+0800 (CST)
 * @Version:0.0.2
 */

var util = require('util');
var Model = require('../Model');
var Config = require('../config');
var Email = require("emailjs");
var ejs = require("ejs");
var ObjectId = require('mongodb').ObjectID;

//template collection
var Template = new Model('template');
var Article = new Model('article');

ejs.filters.dateFormat=function(unix_time_stamp){
    var d=new Date(unix_time_stamp);
    return d.getFullYear()+"-"+(1+d.getMonth())+"-"+d.getDate()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
};

var TemplateModule = {
    /**
     * Display a page for adding a template.
     * @param {Request} req
     * @param {Response} res
     */
    add: function(req, res) {
        return res.render("template-add", {
            title: "Add template",
            template: "{}",
            hasCollection: req.session.collection ? req.session.collection.length : 0
        });
    },
    /**
     * TODO pagination
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     */
    list: function(req, res) {
        return Template.find({}, {
            sort:{
                updateTime:1,
                createTime:1
            }
        }, function(err, result) {
            if (err) {
                return res.render("error", {
                    errMsg: "Query template(s) failed:" + err
                });
            } else {
                return res.render("template-list", {
                    data: result.reverse(),
                    title: "Template(s) List",
                    alertMsg: "All the template(s):",
                    hasCollection: req.session.collection ? req.session.collection.length : 0
                });
            }
        });
    }, //list
    /**
     * Save or update a template through AJAX depends on if '_id' exists.
     * @param  {Request} req
     * @param  {Response} res
     */
    save: function(req, res) {
        var content = req.body.content;
        var name = req.body.name;
        var tid = req.body._id;
        if (!content) {
            return res.json({
                result: 0,
                msg: "Lack of 'content'."
            });
        } else if (!name) {
            return res.json({
                result: 0,
                msg: "Lack of 'name'."
            });
        }

        if (/^[a-z0-9]{24}$/i.test(tid)) {
            return Template.update({
                _id: ObjectId(tid)
            }, {
                $set: {
                    content: content,
                    name: name,
                    updateTime: Date.now()
                }
            }, function(err, result) {
                if (err) {
                    return res.json({
                        result: 0,
                        msg: "save failed:" + err
                    });
                } else {
                    return res.json({
                        result: 1,
                        msg: "Save succeed"
                    });
                }
            });
        } else

        {
            return Template.save({
                content: content,
                name: name,
                createTime: Date.now() //2013-11-03
            }, function(err, result) {
                if (err) {
                    return res.json({
                        result: 0,
                        msg: "save failed" + err
                    });
                } else {
                    return res.json({
                        result: 1,
                        msg: "Save succeed"
                    });
                }
            });
        }
    }, //save
    /**
     * Remove a template.Need a template id[ALL][AJAX].
     * @param  {Request} req
     * @param  {Response} res
     */
    remove: function(req, res) {
        var tid = req.param('tid');
        if (!/^[a-z0-9]{24}$/i.test(tid)) {
            return res.json({
                result: 0,
                msg: "Lack of template"
            });
        }

        Template.remove({
            _id: ObjectId(tid)
        }, {}, function(err, result) {
            if (!err) {
                return res.json({
                    result: 1,
                    msg: "Remove succeed"
                });
            } else {
                return res.json({
                    result: 0,
                    msg: "Remove failed:" + err
                });
            }
        });
    },
    /**
     * Ouput a template for modifying.Need a template id[ALL].
     * @param  {Request} req
     * @param  {Response} res
     */
    edit: function(req, res) {
        var tid = req.param("tid");
        if (!/^[a-z0-9]{24}$/i.test(tid)) {
            return res.render("error", {
                errmsg: "Not valid ID"
            });
        }

        return Template.find({
            _id: ObjectId(tid)
        }, {}, function(err, result) {
            if (err || !util.isArray(result) || !result.length) {
                return res.render("error", {
                    errmsg: "Cannot find tempalte " + tid
                });
            } else {
                var tem = result[0];
                return res.render("template-add", {
                    template: JSON.stringify(tem),
                    title: "Edit template",
                    escape: function(m) {
                        return m
                    }
                });
            }
        });
    },

    /**
     * Render template with articles.Inner function.
     * @param  {Request}   req     
     * @param  {Response}   res     
     * @param  {Function} callback
     */
    _render: function(req, res, callback) {
        var templateId = req.param('tid');

        if (!/^[a-z0-9]{24}$/i.test(templateId)) {
            return res.render("error", {
                errmsg: "Illegal template id"
            });
        }
        //Check collection in session.collection
        if (!util.isArray(req.session.collection) || !req.session.collection.length) {
            return res.render("error", {
                errmsg: "You have no any collection,<a href='/article/list'>Collect one</a>",
                escape: function(m) {
                    return m
                }
            });
        }

        //Construct an array contains ObjectId,which can query in mongoDb
        var inQ = [];
        req.session.collection.forEach(function(item, index) {
            inQ.push(ObjectId(item));
        });

        return Article.find({
            _id: {
                $in: inQ
            }
        }, {
            // limit: 10
        }, function(err, articles) {
            delete inQ;
            if (err || !articles.length) {
                //This should only happen when an article DB item is removed just after a user collect it.
                return res.render('error', {
                    errmsg: "Cannot find articles to render!"
                });
            } else {
                return Template.find({
                    _id: ObjectId(templateId)
                }, {}, function(err, result) {
                    if (err || !util.isArray(result) || !result.length) {
                        //This should happen when a template DB item is removed
                        return res.render('error', {
                            errmsg: "Cannot find template to render!"
                        });
                    } else {
                        var tem = result[0]; //result should be an array whoes length is 0

                        //Set link to each article object
                        articles.forEach(function(article, index) {
                            articles[index].link = Config.serverURL + "/article/read/" + article._id;
                        });

                        try {
                            var content=ejs.render(tem.content,{cache:false,articles:articles});
                            return callback && callback({
                                articles: articles,
                                template: tem,
                                content: content
                            });

                        } catch (e) {
                            return res.render('error', {
                                errmsg: "Error(s) occured when rendering template with article(s):" + e
                            });
                        }
                    }
                });
            }
        });
    },
    /**
     * Mail.Need a mailto[ALL].
     * @param  {Request} req
     * @param  {Response} res
     */
    mail: function(req, res) {

        var myEmail = Config.email;
        var smtp = Config.smtp;
        var pwd = Config.emailPwd;
        var mailto = req.param('mailto');

        var token=req.param('token');
        if(token!=req.session.emailToken){
            return res.render('error',{errmsg:"TOKEN not valid,refresh to retry"});
        }

        return TemplateModule._render(req, res, function(obj) {

            try {
                var server = Email.server.connect({
                    user: myEmail,
                    password: pwd,
                    host: smtp,
                    ssl: true
                });

                return server.send({
                    from: myEmail,
                    to: mailto,
                    subject: Config.emailTitle,
                    attachment: [{
                        data: obj.content,
                        alternative: true
                    }]
                }, function(err, message) {
                    if (err) {
                        return res.render("error", {
                            errmsg: err | "send failed"
                        });
                    } else {
                        //Destroy collection if succeed.
                        delete req.session.collection;
                        return res.render("success", {
                            succmsg: "Email sent successfully!"
                        });
                    }
                });
            } catch (e) {
                return res.render("error", {
                    errmsg: "Unknown error(s) while mailling"
                });
            }

        });
    }, //mail
    /**
     * Use template to create a page with articles.
     * @param  {Request} req
     * @param  {Response} res
     */
    use: function(req, res) {
        return TemplateModule._render(req, res, function(obj) {
            return res.render('template-render', {
                escape: function(m) {
                    return m
                },
                content: obj.content,
                templateId: obj.template._id
            });
        });
    } //use
};

module.exports = TemplateModule;