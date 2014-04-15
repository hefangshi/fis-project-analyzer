#fis-project-analyzer

----------
[![Build Status](https://travis-ci.org/hefangshi/fis-project-analyzer.svg?branch=master)](https://travis-ci.org/hefangshi/fis-project-analyzer)

## Usage

```javascript
var analyzer = require('fis-project-analyzer');
var PageAnalyzer = analyzer.PageAnalyzer;
var ProjectLoader = analyzer.ProjectLoader;
var projectPath = __dirname + "/../testProject";
//set project path for analyzer
var project = new ProjectLoader(projectPath);
var analyzer = new PageAnalyzer(project);
//get a page for test
var page = project.getPages('home')[0];
//get tpl deps from smarty
var result = analyzer.analyzeTpl(page);
//get page deps from smarty recursivly
result = analyzer.getDeps(page);
//get static resource
result = analyzer.getStaticResource(page);
//get package map
result = analyzer.getStaticResourcePkg(page);
```