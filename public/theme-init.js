(function () {
  try {
    var t = localStorage.getItem('brynja-theme');
    var dark = t
      ? t === 'dark'
      : !window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
