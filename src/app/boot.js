// Runs before the first paint (a plain script in <head>): marks that scripts are on, and decides whether
// the opening voyage plays. It plays once per visit, never with reduced motion, never on a deep link.
(function () {
  var html = document.documentElement;
  html.classList.add('js');
  try {
    var seen = sessionStorage.getItem('polaris-intro');
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!seen && !calm && !location.hash) html.classList.add('intro-on');
  } catch (e) { /* storage blocked: skip the intro */ }
})();
