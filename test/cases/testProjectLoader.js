/*
 * fis
 * http://fis.baidu.com/
 * 2014/4/11
 */

'use strict';

var assert = require("assert");
var projectLoader = require("../../lib/projectLoader.js");
var fis = require('fis-kernel');
var projectPath = __dirname + "/../testProject";
var project = new projectLoader(projectPath);
fis.log.level = 0;
describe('projectLoader', function(){
    describe('#getConfs()', function(){
        it('should get project confs with namespace', function(){
            assert.notEqual(project.getConfs()['common'], undefined);
            assert.notEqual(project.getConfs()['home'], undefined);
            assert.equal(project.getConfs()['invliad'], undefined);
        });
        it('should get right content length', function(){
            var resource = [];
            var config = project.getConfs()['common'];
            for (var key in config){
                if (config.hasOwnProperty(key)){
                    resource.push(key);
                }
            }
            assert.equal(resource.length, 10);
        });
        it('should get right widget path', function(){
            var config = project.getConfs()['home'];
            assert.equal(
                config['home:widget/section/docs/commands.tpl'].path,
                fis.util.realpath(projectPath + "/template/home/widget/section/docs/commands.tpl")
            );
        });
        it('should get right static path', function(){
            var config = project.getConfs()['home'];
            assert.equal(
                config['home:static/lib/js/jquery-1.10.1.js'].path,
                fis.util.realpath(projectPath + "/static/home/lib/js/jquery-1.10.1.js")
            );
        });
    });
    describe('#getNamespace()', function(){
        it('should get project namespace', function(){
            assert.deepEqual(project.getNamespace(), ['common','home']);
        });
    });
    describe('#getPackage()', function(){
        it('should get package conf', function(){
            assert.deepEqual(project.getPackage("home:p0"), {
                "uri": "/static/home/pkg/aio.css",
                "type": "css",
                "has": [
                    "home:static/lib/css/bootstrap.css",
                    "home:static/lib/css/bootstrap-responsive.css",
                    "home:widget/section/section.css",
                    "home:widget/slogan/slogan.css"
                ]
            });
            assert.deepEqual(project.getPackage("common:p0"), {
                "uri": "/static/common/pkg/aio.css",
                "type": "css",
                "has": [
                    "common:widget/nav/nav.css",
                    "common:widget/sidebar/sidebar.css"
                ]
            });
        });
    });
    describe('#getPages(namespace)', function(){
        it('should get right page length', function(){
            assert.equal(project.getPages('common').length, 1);
            assert.equal(project.getPages('home').length, 1);
        });
        it('should get right page', function(){
            assert.deepEqual(project.getPages('common')[0], {
                "id": "common:page/layout.tpl",
                "uri": "/template/common/page/layout.tpl",
                "path": fis.util.realpath(projectPath + "/template/common/page/layout.tpl"),
                "type": "tpl",
                "extras": {
                    "isPage": true
                }
            });
            assert.deepEqual(project.getPages('home')[0], {
                "id": "home:page/index.tpl",
                "uri": "/template/home/page/index.tpl",
                "path": fis.util.realpath(projectPath + "/template/home/page/index.tpl"),
                "type": "tpl",
                "extras": {
                    "isPage": true
                }
            });
        });
    });
    describe('#getResource(id)', function(){
        it('should get resource by id', function(){
            assert.equal(project.getResource('home:widget/section/docs/commands.tpl').id,"home:widget/section/docs/commands.tpl");
        });
    });
});
