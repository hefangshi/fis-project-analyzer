fis-project-analyzer
========

A tool to analyze fis-plus project deps

[![Build Status](https://travis-ci.org/hefangshi/fis-project-analyzer.svg?branch=master)](https://travis-ci.org/hefangshi/fis-project-analyzer)
[![Code Climate](https://codeclimate.com/github/hefangshi/fis-project-analyzer.png)](https://codeclimate.com/github/hefangshi/fis-project-analyzer)

## Usage

```javascript
var analyzerlib = require('fis-project-analyzer');
var PageAnalyzer = analyzerlib.PageAnalyzer;
var ProjectLoader = analyzerlib.ProjectLoader;
var projectPath = __dirname + "/../testProject";
//set project path for analyzer
var project = new ProjectLoader(projectPath);
var analyzer = new PageAnalyzer(project);
//get a page for test
var page = project.getPages('home')[0];
//get tpl deps from smarty
var result = analyzer.getCurrentDeps(page);
//get page deps from smarty recursivly
result = analyzer.getRecursiveDeps(page);
//get static resource
result = analyzer.getStaticResource(page);
//get package map
result = analyzer.getStaticResourcePkg(page);
```