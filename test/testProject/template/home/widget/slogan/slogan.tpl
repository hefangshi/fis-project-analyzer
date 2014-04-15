<section class="section" id="slogan">
    <a id="forkme_banner" href="https://github.com/fis-dev/fis">View on GitHub</a>
    <div class="box">
        <h2>前端集成解决方案</h2>
        <h3>Front-end Integrated Solution</h3>
    </div>
    <img src="/static/home/widget/slogan/macbook.png"/>
    {%widget name="home:widget/ad/ad.tpl"%}
    {%script%}
        require('home:widget/slogan/slogan.js').init();
    {%/script%}
</section>