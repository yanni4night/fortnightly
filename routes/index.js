/**
 * Index controller.
 * Copyright(C) Sogou.com UFO
 *
 * @Author:yinyong@sogou-inc.com
 * @Date:Fri Aug 23 2013 19:29:17 GMT+0800 (CST)
 * @Version:0.0.1
 */

var Model=require("../Model");
var Article=new Model("article");

var index = {
    index: function(req, res) {
        return res.render('index', {
            title: 'UFO Fortnightly'
        });
    },
    help: function(req, res) {
        return res.render('help', {
            title: 'UFO Fortnightly'
        });
    },
    about: function(req, res) {
        return res.render('about', {
            title: 'UFO Fortnightly'
        });
    },
    /**
     * Test suit
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     */
    test: function(req, res) {

        return Article.find({}, {}, function(err, result) {
            if (err) {
                return res.render("error", {
                    errmsg: err
                });
            } else {
                return res.send(JSON.stringify(result));
            }
        });
    }
}

module.exports = index;