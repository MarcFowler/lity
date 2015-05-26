;(function() {
  var css = window.Zepto(window.Zepto('[data-rv-lb]')[0]).attr('href');

  if(css.indexOf('/embed/') !== -1) {
    css = css.split('/embed/')[0]+'/player/lightbox';
  } else {
    // @todo No idea what to do here, tbh
  }

  loadCSS(css+'/v1.css');

  window.$ = window.$ || function(){}; // Prevents our bundled Zepto taking over the $
})();
