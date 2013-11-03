/**
 * Model module,supports CRUD
 * Copyright(C) Sogou.com UFO
 *
 * @author yinyong#sogou-inc.com
 * @date Fri Aug 23 2013 19:29:17 GMT+0800 (CST)
 * @version 0.0.1
 */
var dbconfig = require('./dbconfig');
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var ObjectId = require('mongodb').ObjectId;

//Model prototype
var protoType = {

    /**
     * A private function that wraps all kinds of database operations.
     *
     * @param  {Function}   handle   if succeed that function will be called,
     *                                               the first parameter is the quired collection,the second parameter is a function that should be called after all the business opertions all done.
     * @param  {Function} callback error callback function,the first
     *                                             parameter is the error message.
     */
    _query: function(handle, callback) {
        var self = this;

        handle = typeof handle === 'function' ? handle : function() {};
        callback = typeof callback === 'function' ? callback : function() {};

        var mongoClient = new MongoClient(new Server(dbconfig.host, dbconfig.port));
        mongoClient.open(function(err, mongoClient) {
            if (err) {
                mongoClient&&mongoClient.close();
                return callback(err, "open database failed");
            } else {
                var db = mongoClient.db(dbconfig.db);
                var collection = db.collection(self._collections); //Non-safe mode
                return handle(collection, /*Clean function*/ function() {
                    mongoClient&&mongoClient.close();
                })
            }
        });
    },

    /**
     * Save&insert operation.
     * @param  {Object}   data     The Object will be inserted.
     * @param  {Function} callback Error callback function.
     */
    save: function(data, callback) {
        return this._query(function(collection, clean) {
            collection.insert(data, function(err, result) {
                callback(err, result);
                clean();
            });
        }, callback);
    },

    /**
     * Remove operation.
     * @param  {Object}   selector 
     * @param  {Object}   options  
     * @param  {Function} callback 
     */
    remove: function(selector, options, callback) {
        return this._query(function(collection, clean) {
            collection.remove(selector, options, function(err, result) {
                callback(err, result);
                clean();
            });
        }, callback);
    },

    /**
     * Update operation.
     * @param  {Object}   selector 
     * @param  {Object}   options  
     * @param  {Function} callback 
     */
    update: function(selector, options, callback) {
        return this._query(function(collection, clean) {
            collection.update(selector, options, function(err, result) {
                callback(err, result);
                clean();
            });
        }, callback);
    },
    /**
     * Find operation.
     * @param  {Object}   selector 
     * @param  {Object}   options  
     * @param  {Function} callback 
     */
    find: function(selector, options, callback) {
        return this._query(function(collection, clean) {
            collection.find(selector, options).toArray(function(err, result) {
                callback(err, result);
                clean();
            });
        }, callback);
    },
    /**
     * Count operation.
     * @param  {Object}   selector 
     * @param  {Object}   options  
     * @param  {Function} callback 
     */
    count: function(selector, options, callback) {
        return this._query(function(collection, clean) {
            collection.count(selector, options, function(err, result) {
                callback(err, result);
                clean();
            });
        }, callback);
    },
    /**
     * Distinct query operation.
     * @param  {String}   key      The distinct one.
     * @param  {Object}   selector 
     * @param  {Object}   options  
     * @param  {Function} callback 
     */
    distinct: function(key, selector, options, callback) {
        return this._query(function(collection, clean) {
            collection.distinct(key, selector, options, function(err, result) {
                callback(err, result);
                clean();
            });
        }, callback);
    }
};

/**
 * Model.
 * If you wanna operate another collection,you should do this:
 *  <code>var yourCollec=new Model("yourCollection");</code>
 * 
 * @param {String} collectionName 
 */
var Model = function(collectionName) {
    this._collections = collectionName;
};

Model.prototype = protoType;
//Export
module.exports = Model;