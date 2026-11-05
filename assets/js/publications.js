(function () {
  'use strict';

  var FEEDBACK_MS = 2000;

  // One request per BibTeX file, shared by a paper page's preview and its Copy button.
  var bibtexRequests = new Map();

  function themesOf(paper) {
    return (paper.dataset.themes || '').split(' ').filter(Boolean);
  }

  function setupThemeFilters() {
    var group = document.querySelector('.paper-filters');
    var status = document.querySelector('.paper-filters__status');
    if (!group || !status) return;
    var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-theme-filter]'));
    // Every paper takes part, so one missing `themes:` entry cannot leak into each filter.
    var papers = Array.prototype.slice.call(document.querySelectorAll('.paper-box'));
    var knownThemes = buttons.map(function (button) { return button.dataset.themeFilter; }).filter(Boolean);

    function apply(requestedTheme, updateUrl) {
      // Unknown or empty themes (including hand-edited URLs) show every paper.
      var theme = knownThemes.indexOf(requestedTheme) !== -1 ? requestedTheme : '';
      var shown = 0;
      papers.forEach(function (paper) {
        var matches = !theme || themesOf(paper).indexOf(theme) !== -1;
        paper.hidden = !matches;
        if (matches) shown += 1;
      });
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.dataset.themeFilter === theme));
      });
      status.textContent = 'Showing ' + shown + ' of ' + papers.length + ' publications';
      if (updateUrl) {
        var url = new URL(window.location.href);
        if (theme) url.searchParams.set('theme', theme);
        else url.searchParams.delete('theme');
        window.history.replaceState(window.history.state, '', url);
      }
    }

    group.addEventListener('click', function (event) {
      var button = event.target.closest('[data-theme-filter]');
      if (button) apply(button.dataset.themeFilter, true);
    });
    group.hidden = false;
    status.hidden = false;
    var initialTheme = new URLSearchParams(window.location.search).get('theme') || '';
    apply(initialTheme, initialTheme !== '' && knownThemes.indexOf(initialTheme) === -1);
  }

  function fetchBibtex(url) {
    if (!bibtexRequests.has(url)) {
      var request = fetch(url).then(function (response) {
        if (!response.ok) throw new Error('BibTeX request failed with HTTP ' + response.status);
        return response.text();
      });
      // Forget failures so the next attempt asks the server again.
      request.catch(function () { bibtexRequests.delete(url); });
      bibtexRequests.set(url, request);
    }
    return bibtexRequests.get(url);
  }

  // Paper pages render a download link inside the BibTeX block; once the file
  // loads, its text (set as text, never HTML) replaces the link.
  function setupBibtexPreview() {
    if (!window.fetch) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-bib-src]'), function (block) {
      fetchBibtex(block.dataset.bibSrc).then(function (text) {
        block.textContent = text.trim();
        block.dataset.bibState = 'loaded';
      }, function () {
        block.dataset.bibState = 'failed';
      });
    });
  }

  // Passing the pending blob to ClipboardItem keeps the user gesture valid in
  // Safari, which rejects clipboard writes that start after an await. Engines
  // whose ClipboardItem rejects promise values fall back to writeText.
  function writeBibtex(url) {
    var text = fetchBibtex(url);
    if (window.ClipboardItem && navigator.clipboard.write) {
      var blob = text.then(function (value) { return new Blob([value], { type: 'text/plain' }); });
      try {
        return navigator.clipboard.write([new window.ClipboardItem({ 'text/plain': blob })]);
      } catch (error) {
        // The unused blob promise must not surface as an unhandled rejection.
        blob.catch(function () {});
      }
    }
    return text.then(function (value) { return navigator.clipboard.writeText(value); });
  }

  function setupBibtexCopy() {
    var buttons = document.querySelectorAll('.paper-copy-bib');
    if (!buttons.length || !navigator.clipboard || !window.fetch) return;
    var announcer = document.createElement('span');
    announcer.className = 'visually-hidden';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
    var timers = new Map();
    var pending = new Set();

    function showResult(button, copied) {
      pending.delete(button);
      button.removeAttribute('aria-busy');
      button.textContent = copied ? 'Copied' : 'Copy failed';
      announcer.textContent = copied ? 'BibTeX copied to clipboard' : 'Could not copy BibTeX';
      clearTimeout(timers.get(button));
      timers.set(button, setTimeout(function () {
        button.textContent = 'Copy';
        // Clearing lets an identical message be announced again on the next copy.
        announcer.textContent = '';
      }, FEEDBACK_MS));
    }

    Array.prototype.forEach.call(buttons, function (button) {
      button.hidden = false;
      button.addEventListener('click', function () {
        if (pending.has(button)) return;
        pending.add(button);
        button.setAttribute('aria-busy', 'true');
        writeBibtex(button.dataset.bibUrl).then(
          function () { showResult(button, true); },
          function () { showResult(button, false); });
      });
    });
  }

  setupThemeFilters();
  setupBibtexPreview();
  setupBibtexCopy();
})();
