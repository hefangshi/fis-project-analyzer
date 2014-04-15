/*
 * fis
 * http://fis.baidu.com/
 * 2014/4/11
 */

'use strict';

var assert = require("assert");
var pageAnalyzer = require("../../lib/pageAnalyzer.js");
var projectLoader = require("../../lib/projectLoader.js");
var projectPath = __dirname + "/../testProject";
var project = new projectLoader(projectPath);
var fis = require('fis-kernel');
fis.log.level = 0;
var expectPageDeps = {
    "extends": [
        "common:page/layout.tpl"
    ],
    "require": [
        "home:static/lib/css/bootstrap.css",
        "home:static/lib/css/bootstrap-responsive.css",
        "home:static/lib/js/jquery-1.10.1.js",
        "home:static/index/index.css"
    ],
    "widget": [
        "common:widget/sidebar/sidebar.tpl",
        "home:widget/slogan/slogan.tpl",
        "home:widget/section/section.tpl"
    ]
};

var expectRecursiveDeps = {
    "extends": [
        "common:page/layout.tpl"
    ],
    "require": [
        "home:static/lib/css/bootstrap.css",
        "home:static/lib/css/bootstrap-responsive.css",
        "home:static/lib/js/jquery-1.10.1.js",
        "home:static/index/index.css",
        "home:static/lib/js/ad-lib.js", //required by ad.tpl
        "common:static/lib.js" //required by layout.tpl
    ],
    "widget": [
        "common:widget/sidebar/sidebar.tpl",
        "home:widget/slogan/slogan.tpl",
        "home:widget/section/section.tpl",
        "home:widget/ad/ad.tpl", //required by slogan.tpl
        "common:widget/nav/nav.tpl" //required by sidebar.tpl
    ]
};

var expectStaticResource = {
    "async": [
        "common:widget/sidebar/sidebar.async.js",
        "common:widget/calculate/calculate.js"
    ],
    "sync": [
        "common:widget/sidebar/sidebar.css",
        "home:widget/slogan/slogan.js",
        "home:widget/slogan/slogan.css",
        "common:widget/sidebarbase/sidebarbase.js",
        "home:widget/section/section.css",
        "home:widget/ad/ad.js",
        "common:widget/nav/nav.css",
        "home:static/lib/css/bootstrap.css",
        "home:static/lib/css/bootstrap-responsive.css",
        "home:static/lib/js/jquery-1.10.1.js",
        "home:static/index/index.css",
        "home:static/lib/js/ad-lib.js",
        "common:static/lib.js"
    ]
};

var expectPkgMap = {
    "sync": [
        "/static/common/pkg/aio.css",
        "/static/home/pkg/aio.js",
        "/static/home/pkg/aio.css",
        "/static/common/widget/sidebarbase/sidebarbase.js",
        "/static/home/index/index.css",
        "/static/home/lib/js/ad-lib.js",
        "/static/common/lib.js"
    ],
    "async": [
        "/static/common/widget/sidebar/sidebar.async.js",
        "/static/common/widget/calculate/calculate.js"
    ]
};

describe('pageAnalyzer', function(){
    describe('#getCurrentDepsByContent(content,exclude)', function(){
        it("should correctly analyze widget item", function(){
            var testTpl = "{%require name='home:static/index/index.css'%}{%widget \r\n name='home:widget/section/section.tpl'%}{%widget \r\n name='common:widget/nav/nav.tpl' cc=1%}{%widget bb=2 name='home:widget/slogan/slogan.tpl'%}";
            var analyzer = new pageAnalyzer(project);
            var result = analyzer.getCurrentDepsByContent(testTpl);
            assert.equal(result['widget'].length, 3);
            assert.equal(result['require'].length, 1);
            assert.equal(result['require'][0], 'home:static/index/index.css');
        });
        it("should translate extends path to uri", function(){
            var testTpl = "{%extends file='common/page/layout.tpl'%}";
            var analyzer = new pageAnalyzer(project);
            var result = analyzer.getCurrentDepsByContent(testTpl);
            assert.equal(result['extends'].length, 1);
            assert.equal(result['extends'][0], 'common:page/layout.tpl');
        });
        it("should correctly exclude item with single id", function(){
            var analyzer = new pageAnalyzer(project);
            var result = analyzer.getCurrentDepsByContent("{%widget name='common:widget/nav/nav.tpl'%}",'common:widget/nav/nav.tpl');
            assert.equal(result['widget'].length, 0);
        });
        it("should correctly exclude item with idArray", function(){
            var testTpl = "{%widget name='home:widget/section/section.tpl'%}{%widget name='common:widget/nav/nav.tpl'%}{%widget name='home:widget/slogan/slogan.tpl'%}";
            var analyzer = new pageAnalyzer(project);
            var result = analyzer.getCurrentDepsByContent(testTpl,['common:widget/nav/nav.tpl','home:widget/section/section.tpl']);
            assert.equal(result['widget'].length, 1);
            assert.equal(result['widget'][0], 'home:widget/slogan/slogan.tpl');
        });
        it("should support whitespace", function(){
            var testTpl = "{% widget name='home:widget/section/section.tpl' %}";
            var analyzer = new pageAnalyzer(project);
            var result = analyzer.getCurrentDepsByContent(testTpl,[]);
            assert.equal(result['widget'][0], 'home:widget/section/section.tpl');
        });
    });
    describe('#getCurrentDeps(path)', function(){
        it("should get current page's dependencies (not recursive)", function(){
            var analyzer = new pageAnalyzer(project);
            var pages = project.getPages('home');
            var result = analyzer.getCurrentDeps(pages[0]);
            assert.deepEqual(result,expectPageDeps);
        });
    });
    describe('#getRecursiveDeps(pageConf)', function(){
        it('should get right deps', function(){
            var analyzer = new pageAnalyzer(project);
            var pages = project.getPages('home');
            var result = analyzer.getRecursiveDeps(pages[0]);
            assert.deepEqual(result,expectRecursiveDeps);
        });
    });
    describe('#getStaticResource(pageConf)', function(){
        it('should get right resouce map', function(){
            var analyzer = new pageAnalyzer(project);
            var pages = project.getPages('home');
            var result = analyzer.getStaticResource(pages[0]);
            assert.deepEqual(result,expectStaticResource);
        });
    });
    describe('#getStaticResourcePkg(pageConf)', function(){
        it('should get right pkg map', function(){
            var analyzer = new pageAnalyzer(project);
            var pages = project.getPages('home');
            var result = analyzer.getStaticResourcePkg(pages[0]);
            assert.deepEqual(result,expectPkgMap);
        });
    });
});
