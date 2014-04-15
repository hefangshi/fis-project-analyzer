<!DOCTYPE html>
{%* 使用html插件替换普通html标签，同时注册JS组件化库 *%}
{%html framework="common:static/mod.js" class="expanded"%}
    {%* 使用head插件替换head标签，主要为控制加载同步静态资源使用 *%}
	{%head%}
	    <meta charset="utf-8"/>
    	<meta content="{%$description%}" name="description">
    	<title>{%$title%}</title>
        {%require name="common:static/lib.js"%}
    	{%block name="block_head_static"%}{%/block%}
	{%/head%}
	{%* 使用body插件替换body标签，主要为可控制加载JS资源 *%}
	{%body%}
        {%widget name="common:widget/nav/nav.tpl"%}
		{%block name="content"%}{%/block%}
	{%require name='common:page/layout.tpl'%}{%/body%}
{%/html%}