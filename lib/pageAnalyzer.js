/*
 * fis
 * http://fis.baidu.com/
 * 2014/4/11
 */

'use strict';

var fis = global.fis || require('fis-kernel');
var fs = require('fs');
var assert = require('assert');
var commentRegex = /{%\*(.|\n)*?\*%}/g;
var extendsRegex = {
        regex:/({%\s?extends\s.*?%})/g,
        property:/\s?file\s?=\s?['|"](.*?)['|"]/
    },
    widgetRegex = {
        regex:/({%\s?widget\s.*?%})/g,
        property:/\s?name\s?=\s?['|"](.*?)['|"]/
    },
    requireRegex = {
        regex: /({%\s?require\s.*?%})/g,
        property: /\s?name\s?=\s?['|"](.*?)['|"]/
    },
    tagRegexs = {
        "extends": extendsRegex,
        "widget": widgetRegex,
        "require": requireRegex
    };
var pagePathReg = /(.*?)\/(.*)\/(.*\.tpl)/;

var pageAnalyzer = function(project){
    var workingPage = {};
    var donePage = {};

    function getStaticResourceByDeps(selfID, deps){
        var analyzeCache = {};
        var staticSyncPool = [];
        var staticAsyncPool = [];
        var all = deps['widget'].concat(deps['extends']);
        //push page it self to all to handle deps
        all.push(selfID);
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
            if (!analyzeCache[id])
                analyzeCache[id] = true;
            else
                return {sync:[],async:[]};
            fis.log.debug('analyze resource deps ['+id+']');
            var conf = project.getResource(id);
            //check if conf is exist
            if (!conf)
                return {sync:[],async:[]};
            var sync = conf.deps || [];
            var async = [];
            if (conf.extras && conf.extras.async){
                async = conf.extras.async;
            }
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

    function getStaticResource(pageConf){
        var deps = getRecursiveDeps(pageConf);
        return getStaticResourceByDeps(pageConf.id, deps);
    }

    function getPkgByResource(resource){
        var pkg = {
            'async':[],
            'sync':[]
        };
        resource.async.forEach(function(async){
            var uri = getResourceUri(async);
            uri && pkg.async.push(uri);
        });
        resource.sync.forEach(function(sync){
            var uri = getResourceUri(sync);
            uri && pkg.sync.push(uri);
        });
        return {
            sync:pkg.sync.filter(unique),
            async:pkg.async.filter(unique).filter(function(value){
                return pkg.sync.indexOf(value) == -1;
            })
        };

        function getResourceUri(id){
            var resource = project.getResource(id);
            if (!resource)
                return false;
            assert.notEqual(resource,null);
            var uri = resource.uri;
            if (resource.pkg){
                var pkgConf = project.getPackage(resource.pkg);
                uri = pkgConf.uri;
            }
            return uri;
        }
    }

    function getStaticResourcePkgByDeps(selfID, deps){
        var resource = getStaticResourceByDeps(selfID, deps);
        return getPkgByResource(resource);
    }

    function getStaticResourcePkg(pageConf){
        var deps = getRecursiveDeps(pageConf);
        return getStaticResourcePkgByDeps(pageConf.id, deps)
    }

    /**
     * get deps module recursively
     * @param pageConf
     */
    function getRecursiveDeps(pageConf){
        fis.log.debug('analyze tpl [' + (pageConf.id || pageConf) + ']');
        var result = getCurrentDeps(pageConf);
        //fix for-loop length to prevent recall new widget analyze
        for (var i= 0, length = result['widget'].length; i < length; i++){
            var widget = result['widget'][i];
            fis.log.debug('call widget tpl [' + widget + '] analyze from [' + (pageConf.id || pageConf) + ']');
            var widgetModule = getRecursiveDeps(widget);
            arrayMerge(result['widget'], widgetModule['widget']);
            arrayMerge(result['require'], widgetModule['require']);
        }
        result['extends'].forEach(function(page){
            fis.log.debug('call extends tpl [' + page + '] analyze from [' + (pageConf.id || pageConf) + ']');
            var pageModule = getRecursiveDeps(page);
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
    function getCurrentDeps(page){
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
            donePage[path] = getCurrentDepsByContent(data, pageConf.id);
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
    function getCurrentDepsByContent(content, exclude){
        if (exclude instanceof Array == false){
            exclude = [exclude||""];
        }
        content = content.toString().replace(/\n|\s\s+/g," ").replace(commentRegex,'');
        var result = {};
        var match;
        //find {%widget name='.*'%} {%require name='.*'%} {%extends file='.*'%}
        fis.util.map(tagRegexs, function(tag, regexConf){
            result[tag] = [];
            var regex = regexConf.regex;
            //get target
            while(match = regex.exec(content)) {
                //get property
                var propMatch = match[1].match(regexConf.property);
                if (!propMatch || propMatch.length <2)
                    continue;
                var id = propMatch[1];
                //format extends path
                if (tag === 'extends'){
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
        getRecursiveDeps:getRecursiveDeps,
        getCurrentDeps:getCurrentDeps,
        getCurrentDepsByContent:getCurrentDepsByContent,
        getStaticResource:getStaticResource,
        getStaticResourcePkg:getStaticResourcePkg,
        getStaticResourceByDeps:getStaticResourceByDeps,
        getStaticResourcePkgByDeps:getStaticResourcePkgByDeps,
        getPkgByResource:getPkgByResource
    }
};

module.exports = pageAnalyzer;