/**
 * past.js
 * show past published fortnightly
 *
 * changelog
 * 2013-11-03:create
 *
 * @author yinyong#sogou-inc.com
 * @date  Sun Nov 03 2013 20:44:10 GMT+0800 (CST)
 * @version 0.0.1
 */

var util=require('util');
var config=require('../config');
var Model = require('../Model');
var ObjectId = require('mongodb').ObjectID;

var Past = new Model('Past');

module.exports={
    /**
     * [read description]
     * @param  {Request} req
     * @param  {Response} res
     */
    read:function(req,res){
        var _id=res.param('id');
        if(!/^[a-z0-9]{24}$/.test(_id)){
            return res.render("error",{errMsg:"Lack of id"});
        }
        return Past.find({
            _id:ObjectId(_id)
        }, {}, function(err, published) {
            if (err||!util.isArray(published)||published.length!==1) {
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
     * [save description]
     * @param  {[type]} content
     * @return {[type]}       
     */
    save:function(content){
        return Past.save({
                content: content,
                createTime: Date.now() 
            },function(err){

            });
    },
    /**
     * [list description]
     * @param  {Request} req
     * @param  {Response} res
     */
    list:function(req,res) {
        return Past.find({},{},function(err,published){
            if(err||!util.isArray(published)){
                return req.render("error",{errMsg:err});
            }else{
                return res.render("past-list",{
                    published:published,
                    page:"past"
                });
            }
        });
    }
};