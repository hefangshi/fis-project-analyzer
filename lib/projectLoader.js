/*
 * fis
 * http://fis.baidu.com/
 * 2014/4/11
 */

'use strict';

var fis = global.fis || require('fis-kernel');
var assert = require('assert');
var path = require('path');
/**
 *
 * @param projectPath
 * @param options
 *
 * options.configDir : set config file to load same project with different map.json (multi package policy support)
 *
 * @returns {{getConfs: getConfs, getNamespace: getNamespace, getPages: getPages, getResource: getResource, getPackage: getPackage}}
 */
var projectLoader = function (projectPath, options){
    var conf = null;
    var resPool = null;
    var pkgs = null;
    var uriResPool = null;
    var hashResPool = null;
    options = options || {};
    getConfs();

    function getConfs(){
        if (conf)
            return conf;
        resPool = {};
        uriResPool = {};
        hashResPool = {};
        pkgs = {};
        var configDir = options.configDir || fis.util.realpath(projectPath + "/config"),
            configReg =  /[\/|\\](.*)-map\.json$/,
            moduleReg = /(.*)-map\.json$/,
            widgetPreg = /\w+\/widget\/.+\.tpl$/,
            configFiles = fis.util.find(configDir, configReg),
            configRes = {};
        configFiles.forEach(function(file){
            var fileMatch = path.basename(file).match(moduleReg);
            assert.equal(fileMatch.length, 2);
            var fileName = fileMatch[1];
            fis.log.debug('read conf from ['+file+']');
            var moduleConf = fis.util.readJSON(file);
            var res = moduleConf['res'];
            var pkg = moduleConf['pkg'];
            //get res real path
            fis.util.map(res, function(resID, resConf){
                resConf.id = resID;
                if (widgetPreg.test(resConf.uri)){
                    resConf.path = fis.util.realpath(projectPath + '/template/' + resConf.uri);
                }else{
                    resConf.path = fis.util.realpath(projectPath + '/' + resConf.uri);
                }
                resPool[resConf.id] = resConf;
                uriResPool[resConf.uri] = resConf;
                if (resConf.hash)
                    hashResPool[resConf.hash] = resConf;
            });
            fis.util.map(pkg, function(resID, resConf){
                resConf.id = resID;
                resConf.path = fis.util.realpath(projectPath + '/' + resConf.uri);
                resPool[resConf.id] = resConf;
                uriResPool[resConf.uri] = resConf;
                if (resConf.hash)
                    hashResPool[resConf.hash] = resConf;
            });
            fis.util.merge(pkgs, moduleConf['pkg']);
            configRes[fileName] = res;
        });
        conf = configRes;
        return conf;
    }

    function getNamespace(){
        var ns = [];
        for (var key in conf){
            if (conf.hasOwnProperty(key)){
                ns.push(key);
            }
        }
        return ns;
    }

    function getPages(namespace){
        var pages = [];
        fis.util.map(conf[namespace], function(resID, resConf){
            if (resConf.extras && resConf.extras.isPage){
                pages.push(resConf);
            }
        });
        return pages;
    }

    function getPackage(pkg){
        return pkgs[pkg];
    }

    function getResource(id){
        return resPool[id];
    }

    function getResourceByUri(uri){
        return uriResPool[uri];
    }

    function getResourceByHash(hash){
        return hashResPool[hash];
    }

    return {
        getConfs:getConfs,
        getNamespace:getNamespace,
        getPages:getPages,
        getResource:getResource,
        getPackage:getPackage,
        getResourceByUri:getResourceByUri,
        getResourceByHash:getResourceByHash,
        getProjectPath: function(){
            return projectPath;
        }
    };
};

module.exports = projectLoader;