/*
 * fis
 * http://fis.baidu.com/
 * 2014/4/11
 */

'use strict';

/**
 *
 * @param project projectLoader
 * @returns {{getDeps: getDeps}}
 */

var fis = require('fis-kernel');
var fs = require('fs');
var assert = require('assert');
var extendsRegx = /{%\s?extends\s+(?:.*?\s+)*?file\s?=\s?['|"](.*?)['|"].*?%}/g,
    widgetRegx = /{%\s?widget\s+(?:.*?\s+)*?name\s?=\s?['|"](.*?)['|"].*?%}/g,
    requireRegx = /{%\s?require\s+(?:.*?\s+)*?name\s?=\s?['|"](.*?)['|"].*?%}/g,
    tagRegxs = {
        "extends": extendsRegx,
        "widget": widgetRegx,
        "require": requireRegx
    };
var pagePathReg = /(\w+)\/(.*)\/(\w+\.tpl)/;

var pageAnalyzer = function(project){
    var workingPage = {};
    var donePage = {};

    function getStaticResource(pageConf){
        var deps = getDeps(pageConf);
        var staticSyncPool = [];
        var staticAsyncPool = [];
        var all = deps['widget'].concat(deps['extends']);
        //push page it self to all to handle deps
        all.push(pageConf.id);
        all.forEach(function(id){
            var childDeps = getStaticDepsFromMapJson(id);
            staticSyncPool = staticSyncPool.concat(childDeps.sync);
            staticAsyncPool = staticAsyncPool.concat(childDeps.async);
        });
        deps['require'].forEach(function(id){
            //push require it self to sync pool
            staticSyncPool.push(id);
            var childDeps = getStaticDepsFromMapJson(id);
            staticSyncPool = staticSyncPool.concat(childDeps.sync);
            staticAsyncPool = staticAsyncPool.concat(childDeps.async);
        });
        return {
            sync:staticSyncPool.filter(unique),
            //exclude async resource from sync resource
            async:staticAsyncPool.filter(unique).filter(function(value){
                return staticSyncPool.indexOf(value) == -1;
            })
        };

        function getStaticDepsFromMapJson(id){
            var conf = project.getResource(id);
            var sync = conf.deps || [];
            var async = [];
            conf.extras && conf.extras.async && (async = conf.extras.async);
            sync.forEach(function(dep){
                var deps = getStaticDepsFromMapJson(dep);
                sync = sync.concat(deps.sync);
            });
            async.forEach(function(dep){
                var deps = getStaticDepsFromMapJson(dep);
                async = async.concat(deps.sync);
                async = async.concat(deps.async);
            });
            return {
                sync:sync,
                async:async
            }
        }
    }

    function getStaticResourcePkg(pageConf){
        var deps = getStaticResource(pageConf);
        var pkg = {
            'async':[],
            'sync':[]
        };
        deps.async.forEach(function(async){
            pkg.async.push(getResourceUri(async));
        });
        deps.sync.forEach(function(sync){
            pkg.sync.push(getResourceUri(sync));
        });
        return {
            sync:pkg.sync.filter(unique),
            async:pkg.async.filter(unique)
        };

        function getResourceUri(id){
            var resource = project.getResource(id);
            assert.notEqual(resource,null);
            var uri = resource.uri;
            if (resource.pkg){
                var pkgConf = project.getPackage(resource.pkg);
                uri = pkgConf.uri;
            }
            return uri;
        }
    }

    /**
     * get deps module recursively
     * @param pageConf
     */
    function getDeps(pageConf){
        fis.log.debug('analyze tpl [' + (pageConf.id || pageConf) + ']');
        var result = analyzeTpl(pageConf);
        //fix for-loop length to prevent recall new widget analyze
        for (var i= 0, length = result['widget'].length; i < length; i++){
            var widget = result['widget'][i];
            fis.log.debug('call widget tpl [' + widget + '] analyze from [' + (pageConf.id || pageConf) + ']');
            var widgetModule = getDeps(widget);
            arrayMerge(result['widget'], widgetModule['widget']);
            arrayMerge(result['require'], widgetModule['require']);
        }
        result['extends'].forEach(function(page){
            fis.log.debug('call extends tpl [' + page + '] analyze from [' + (pageConf.id || pageConf) + ']');
            var pageModule = getDeps(page);
            arrayMerge(result['widget'], pageModule['widget']);
            arrayMerge(result['require'], pageModule['require']);
        });
        return result;

        function arrayMerge(array1, array2){
            array2.forEach(function(item){
                if (array1.indexOf(item) != -1){
                    return true;
                }
                fis.log.debug(['put [', item, '] into [', pageConf.id||pageConf,']'].join(''));
                array1.push(item);
            });
        }
    }

    /**
     * analyze tpl, get widget & require & extends module (no recursive)
     * @param page
     */
    function analyzeTpl(page){
        var pageConf = page;
        if (typeof page == 'string')
            pageConf = project.getResource(page);
        if (!pageConf){
            fis.log.warning('unable to load resource [' + page + ']: No such resource id.\n');
            return {
                "extends": [],
                "widget": [],
                "require": []
            }
        }
        var path = pageConf.path;
        if (donePage[path]){
            return donePage[path];
        }
        if (fis.util.exists(path)){
            var data = fs.readFileSync(path);
            donePage[path] = analyzeTplByContent(data, pageConf.id);
            workingPage[path] = null;
            return donePage[path];
        }else{
            fis.log.error('unable to read file[' + path + ']: No such file or directory.');
        }
    }

    /**
     * analyze tpl content to get require, widget, extends deps
     * @param content
     * @param exclude
     * @returns {{}}
     */
    function analyzeTplByContent(content, exclude){
        if (exclude instanceof Array == false){
            exclude = [exclude||""];
        }
        content = content.toString().replace(/\n|\s\s+/g," ");
        var result = {};
        var match;
        //find {%widget name='.*'%} {%require name='.*'%} {%extends file='.*'%}
        fis.util.map(tagRegxs, function(tag, regx){
            result[tag] = [];
            while(match = regx.exec(content)) {
                var id = match[1];
                //format extends path
                if (tag == 'extends'){
                    //extends file need trans to resource id
                    id = id.replace(pagePathReg, function(input, namespace, path, file){
                        return [namespace, ":", path, "/", file].join('');
                    });
                }
                //remove self require
                if (exclude.indexOf(id) != -1)
                    continue;
                //remove duplicate
                if (result[tag].indexOf(id) != -1)
                    continue;
                //remove invalid item
                if (project.getResource(id) == null){
                    fis.log.warning('unable to load resource [' + id + ']: No such resource id.\n');
                    continue;
                }
                result[tag].push(id);
            }
        });
        return result;
    }

    function unique(value, index, self){
        return self.indexOf(value) === index;
    }

    return {
        getDeps:getDeps,
        analyzeTpl:analyzeTpl,
        analyzeTplByContent:analyzeTplByContent,
        getStaticResource:getStaticResource,
        getStaticResourcePkg:getStaticResourcePkg
    }
};

module.exports = pageAnalyzer;