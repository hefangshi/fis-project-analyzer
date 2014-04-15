<a id="btn-navbar" class="btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
</a>
{%script%}
    $('.btn-navbar').click(function() {
        require.async('common:widget/sidebar/sidebar.async.js', function(sidebar){
            sidebar.run();
        });
    });
{%/script%}