(function () {
  'use strict';

  var dialog = document.getElementById('hpc-terminal');
  var trigger = document.querySelector('.hpc-terminal-trigger');
  if (!dialog || !trigger || typeof dialog.showModal !== 'function') return;

  var output = dialog.querySelector('[role="log"]');
  var input = dialog.querySelector('input');
  var templates = new Map();
  document.querySelectorAll('[data-terminal-command]').forEach(function (template) {
    templates.set(template.dataset.terminalCommand, template);
  });
  var commands = ['whoami', 'research', 'papers', 'projects', 'help', 'clear', 'exit'];
  var history = [];
  var historyIndex = 0;
  var draft = '';
  var previousFocus;
  var previousOverflow;

  function appendTemplate(command) {
    var entry = document.createElement('div');
    entry.className = 'hpc-terminal__entry';
    entry.appendChild(templates.get(command).content.cloneNode(true));
    output.appendChild(entry);
  }

  function scrollToBottom() {
    // Bound DOM growth during long sessions; command history is kept separately.
    while (output.children.length > 100) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }

  function run(rawCommand) {
    var command = rawCommand.trim();
    if (!command) return;
    var echo = document.createElement('p');
    echo.className = 'hpc-terminal__echo';
    echo.textContent = 'chenxu@hpc-ai:~$ ' + command;
    output.appendChild(echo);
    history.push(command);
    if (history.length > 50) history.shift();
    historyIndex = history.length;
    draft = '';
    input.value = '';

    var normalized = command.toLowerCase();
    if (normalized === 'clear') {
      output.replaceChildren();
    } else if (normalized === 'exit') {
      dialog.close();
      return;
    } else if (commands.includes(normalized)) {
      appendTemplate(normalized);
    } else {
      var error = document.createElement('p');
      error.className = 'hpc-terminal__error';
      error.textContent = 'Command not found: ' + command;
      output.appendChild(error);
    }
    scrollToBottom();
    input.focus({ preventScroll: true });
  }

  function open() {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    if (!output.children.length) appendTemplate('welcome');
    scrollToBottom();
    input.focus({ preventScroll: true });
  }

  trigger.hidden = false;
  trigger.addEventListener('click', open);
  dialog.addEventListener('close', function () {
    document.body.style.overflow = previousOverflow;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
  });
  dialog.querySelector('[data-terminal-close]').addEventListener('click', function () {
    dialog.close();
  });
  dialog.addEventListener('click', function (event) {
    var commandButton = event.target.closest('[data-terminal-run]');
    if (commandButton) run(commandButton.dataset.terminalRun);
    if (event.target === dialog) {
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();
    run(input.value);
  });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (historyIndex === history.length) draft = input.value;
      if (historyIndex > 0) input.value = history[--historyIndex];
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < history.length) historyIndex++;
      input.value = historyIndex === history.length ? draft : history[historyIndex];
    } else if (event.key === 'Tab' && !event.shiftKey && input.value.trim()) {
      var matches = commands.filter(function (command) {
        return command.startsWith(input.value.trim().toLowerCase());
      });
      if (matches.length === 1 && matches[0] !== input.value) {
        event.preventDefault();
        input.value = matches[0];
      }
    }
  });

  var sequence = '';
  var lastKeyTime = 0;
  document.addEventListener('keydown', function (event) {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.repeat ||
        event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    if (event.key.length !== 1) {
      sequence = '';
      return;
    }
    var now = Date.now();
    if (now - lastKeyTime > 1500) sequence = '';
    lastKeyTime = now;
    sequence = (sequence + event.key.toLowerCase()).slice(-3);
    if (sequence === 'hpc') {
      sequence = '';
      open();
    }
  });
})();
