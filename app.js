
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var article = require('./routes/article');
var template = require('./routes/template');
var publish = require('./routes/publish');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo');

var app = express();

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('what-should-I-put-here'));
app.use(express.session({cookie: { maxAge: 1800000 }}));
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public',yuicompress:true }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/index', routes.index);
app.get('/about', routes.about);
app.get('/help', routes.help);
app.get('/test', routes.test);
app.get('/article/add', article.add);
app.post('/article/save', article.save);//Ajax post
app.post('/article/update', article.update);//Ajax post
app.get('/article/search/:key/:page', article.search);
app.get('/article/search', article.search);
app.get('/article/tags/:tag/:page', article.tags);
app.get('/article/tags/:tag', article.tags);
app.get('/article/tags', article.tags);
app.all('/article/collection', article.collection);
app.all('/article/collect', article.collect);
app.all('/article/uncollect', article.uncollect);
app.get('/article/list/:page', article.list);
app.get('/article/list', function(req,res){res.redirect('/article/list/1')});
app.get('/article/read/:id', article.read);
app.get('/article/read', function(req,res){res.redirect('/article/list')});
app.get('/article/edit/:id', article.edit);
app.get('/article/edit', function(req,res){res.redirect('/article/list')});
app.get('/article', function(req,res){res.redirect('/article/list/1')});
app.get('/article/addgrab',article.addGrab);
app.post('/article/grab',article.grabUrl);

app.get('/template/add',template.add);
app.get('/template/mail/:tid',template.mail);
app.get('/template/mail',template.mail);
app.get('/template/edit/:tid',template.edit);
app.post('/template/remove',template.remove);
app.get('/template/list',template.list);
app.get('/template/use/:tid',template.use);
app.post('/template/save',template.save);
app.get('/template',function(req,res){res.redirect('/template/list/');});
app.get('/publish',publish.publish);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
