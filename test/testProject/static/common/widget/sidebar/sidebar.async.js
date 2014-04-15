define('common:widget/sidebar/sidebar.async.js', function(require, exports, module){

require("common:widget/sidebarbase/sidebarbase.js");
require("common:widget/calculate/calculate.js");
exports.run = function(){
    $('html').toggleClass('expanded');
};

});