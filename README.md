fis-project-analyzer
=================

## Usage
```javascript
var analyzer = require('fis-project-analyzer');
var PageAnalyzer = analyzer.PageAnalyzer;
var ProjectLoader = analyzer.ProjectLoader;
var projectPath = __dirname + "/../testProject";
var project = new ProjectLoader(projectPath);
var analyzer = new PageAnalyzer(project);
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