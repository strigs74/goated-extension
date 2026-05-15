(function () {
  'use strict';

  let currentBalance = 0;
  let extensionEnabled = true;
  let balanceEnabled = true;

  // Grab real balance values immediately before anything else runs
  // Use a small delay to let the page render its values first
  setTimeout(captureRealValues, 0);
  setTimeout(captureRealValues, 500);
  setTimeout(captureRealValues, 1500);

  // Load settings from storage, then init
  chrome.storage.local.get(['enabled', 'balanceEnabled', 'fakeBalance'], (data) => {
    extensionEnabled = data.enabled !== false;
    balanceEnabled   = data.balanceEnabled !== false;
    currentBalance   = data.fakeBalance ?? 0;
    if (balanceEnabled) updateBalanceDisplays();
  });

  // React to popup changes instantly without needing a page refresh
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled)       extensionEnabled = changes.enabled.newValue;
    if (changes.balanceEnabled) {
      balanceEnabled = changes.balanceEnabled.newValue;
      if (balanceEnabled) updateBalanceDisplays();
      else restoreBalanceDisplays();
    }
    if (changes.fakeBalance) {
      currentBalance = changes.fakeBalance.newValue;
      if (balanceEnabled) updateBalanceDisplays();
    }
  });

  function saveBalance() {
    chrome.storage.local.set({ fakeBalance: currentBalance });
  }

  function formatRobux(n) {
    return n.toLocaleString('en-US');
  }

  function isBalanceSpan(span) {
    const cls = span.className;
    return (
      (cls.includes('font-builder-extended') && cls.includes('text-title-large')) ||
      (cls.includes('rbx-text-navbar-right') && cls.includes('text-header')) ||
      (cls.includes('text-label-medium') && cls.includes('content-emphasis'))
    );
  }

  // Snapshot of real Robux values captured before we ever overwrite them
  const realValues = new Map();

  // Matches real Roblox balance text: digits/commas OR abbreviated like "877K+"
  function isRealBalanceText(text) {
    return /^[\d,]+$/.test(text.trim()) || /^[\d,.]+[KMB]\+?$/.test(text.trim());
  }

  function captureRealValues() {
    const nav = document.getElementById('nav-robux-amount');
    if (nav && !realValues.has(nav) && isRealBalanceText(nav.textContent)) {
      realValues.set(nav, nav.textContent);
    }
    document.querySelectorAll('span').forEach(span => {
      if (isBalanceSpan(span) && !realValues.has(span) && isRealBalanceText(span.textContent)) {
        realValues.set(span, span.textContent);
      }
    });
  }

  function updateBalanceDisplays() {
    captureRealValues(); // always snapshot before writing
    const formatted = formatRobux(currentBalance);
    const nav = document.getElementById('nav-robux-amount');
    if (nav) nav.textContent = formatted;
    document.querySelectorAll('span').forEach(span => {
      if (isBalanceSpan(span) && isRealBalanceText(span.textContent)) {
        span.textContent = formatted;
      }
    });
  }

  function restoreBalanceDisplays() {
    realValues.forEach((original, el) => {
      if (document.contains(el)) el.textContent = original;
    });
    // don't clear — keep the real values so re-enabling works correctly
  }

  const balanceObserver = new MutationObserver(() => {
    const formatted = formatRobux(currentBalance);
    document.querySelectorAll('span').forEach(span => {
      if (isBalanceSpan(span) && isRealBalanceText(span.textContent)) {
        if (span.textContent.trim() !== formatted) {
          if (!realValues.has(span)) realValues.set(span, span.textContent);
          if (balanceEnabled) span.textContent = formatted;
        }
      }
    });
    const nav = document.getElementById('nav-robux-amount');
    if (nav && isRealBalanceText(nav.textContent)) {
      const formatted2 = formatRobux(currentBalance);
      if (nav.textContent.trim() !== formatted2) {
        if (!realValues.has(nav)) realValues.set(nav, nav.textContent);
        if (balanceEnabled) nav.textContent = formatted2;
      }
    }
  });
  balanceObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

  function robuxIcon(size) {
    return `<span role="presentation" class="grow-0 shrink-0 basis-auto icon icon-regular-robux" style="font-size:${size}px;width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;"></span>`;
  }

  function isLightMode(dialog) {
    const bg = getComputedStyle(dialog).backgroundColor;
    const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return false;
    const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    return r >= 240 && g >= 240 && b >= 240;
  }

  function showToast(amount, light) {
    const existing = document.getElementById('fake-robux-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'fake-robux-toast';
    toast.innerHTML = `
      <style>
        #fake-robux-toast {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          background: ${light ? '#202226' : '#ffffff'};
          color: ${light ? '#e8e9ec' : '#111'};
          border-radius: 10px;
          padding: 12px 16px 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          min-width: 220px;
          animation: fake-toast-in 0.2s ease;
        }
        @keyframes fake-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        #fake-robux-toast .toast-check {
          width: 20px; height: 20px;
          background: ${light ? '#e8e9ec' : '#111'};
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        #fake-robux-toast .toast-check svg { width: 11px; height: 11px; }
        #fake-robux-toast .toast-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
          font-size: 16px;
          line-height: 1;
          padding: 0 0 0 8px;
          flex-shrink: 0;
        }
      </style>
      <div class="toast-check">
        <svg viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="${light ? '#202226' : 'white'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span>You sent ${formatRobux(amount)} Robux</span>
      <button class="toast-close" aria-label="Dismiss">&#x2715;</button>
    `;

    document.body.appendChild(toast);
    const closeBtn = toast.querySelector('.toast-close');
    let timer = setTimeout(() => toast.remove(), 4000);
    closeBtn.addEventListener('click', () => { clearTimeout(timer); toast.remove(); });
  }

  function showAmountScreen(scrollContainer, username, avatarUrl, light) {
    let selectedAmount = 0;

    const btnBg      = light ? '#dddee5'        : 'rgb(47, 49, 55)';
    const btnBgSel   = light ? '#cacbd4'        : 'rgb(24, 26, 32)';
    const textColor  = light ? '#222224'        : '#fff';
    const subColor   = light ? '#555558'        : '#888';
    const outlineSel = light ? '#222224'        : '#ffffff';

    scrollContainer.innerHTML = `
      <style id="fake-screen-styles">
        .fake-amt-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: ${btnBg};
          border: none;
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-radius: 8px;
          padding: 10px 18px;
          color: ${textColor};
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          min-width: 72px;
          justify-content: center;
          transition: background 0.1s, outline-color 0.1s;
        }
        .fake-amt-btn.selected {
          background: ${btnBgSel};
          outline-color: ${outlineSel};
        }
        #fake-custom-number {
          width: 100%;
          background: ${btnBg};
          border: none;
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-radius: 8px;
          padding: 12px 14px;
          color: ${textColor};
          font-size: 15px;
          font-weight: 500;
          box-sizing: border-box;
          transition: outline-color 0.1s, background 0.1s;
        }
        #fake-custom-number:focus {
          outline-color: ${outlineSel};
          background: ${btnBgSel};
        }
        #fake-custom-number::placeholder { color: #888; }
        #fake-custom-number::-webkit-outer-spin-button,
        #fake-custom-number::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        #fake-custom-number[type=number] { -moz-appearance: textfield; }
        #fake-next-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: none;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: default;
          background: ${light ? '#95abfd' : '#2a3a7a'};
          opacity: ${light ? '1' : '0.6'};
          transition: background 0.15s, opacity 0.15s;
        }
        #fake-next-btn.active {
          background: ${light ? '#325eff' : '#3b5bdb'};
          opacity: 1;
          cursor: pointer;
        }
        .fade-out-entirely {
          opacity: 0 !important;
          transition: opacity 0.4s ease-out !important;
          pointer-events: none !important;
        }
      </style>
      <div id="fake-amount-screen" style="display:flex;flex-direction:column;align-items:center;padding:24px 32px 32px;gap:20px;min-height:40vh;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;background:#3a3a60;">
            ${avatarUrl
              ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:22px;">👤</div>`
            }
          </div>
          <span style="color:${textColor};font-size:15px;font-weight:600;">${username}</span>
        </div>

        <div style="display:flex;align-items:center;gap:10px;">
          ${robuxIcon(36)}
          <span id="fake-amount-display" style="color:${textColor};font-size:36px;font-weight:700;line-height:1;">0</span>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;width:100%;">
          ${[25, 50, 100, 200].map(amt => `<button class="fake-amt-btn" data-amount="${amt}">${robuxIcon(18)} ${amt}</button>`).join('')}
        </div>

        <div style="width:100%;">
          <input id="fake-custom-number" type="number" min="1" placeholder="Custom Amount..." />
        </div>

        <button id="fake-next-btn">Send Robux</button>
        <span style="color:${subColor};font-size:12px;">Robux are sent instantly with no fees</span>
      </div>
    `;

    const nextBtn = scrollContainer.querySelector('#fake-next-btn');
    const amountDisplay = scrollContainer.querySelector('#fake-amount-display');
    const customInput = scrollContainer.querySelector('#fake-custom-number');

    function setAmount(val) {
      selectedAmount = val;
      amountDisplay.textContent = val > 0 ? formatRobux(val) : '0';
      nextBtn.classList.toggle('active', val > 0);
    }

    scrollContainer.querySelectorAll('.fake-amt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        scrollContainer.querySelectorAll('.fake-amt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        customInput.value = '';
        setAmount(parseInt(btn.dataset.amount));
      });
    });

    customInput.addEventListener('input', () => {
      scrollContainer.querySelectorAll('.fake-amt-btn').forEach(b => b.classList.remove('selected'));
      const val = parseInt(customInput.value);
      setAmount(isNaN(val) ? 0 : val);
    });

    nextBtn.addEventListener('click', () => {
      if (selectedAmount <= 0) return;

      currentBalance = Math.max(0, currentBalance - selectedAmount);
      saveBalance();
      if (balanceEnabled) updateBalanceDisplays();

      const overlay = document.querySelector('[data-testid="fui-base-sheet-overlay"]');
      if (overlay) {
        overlay.classList.add('fade-out-entirely');
        setTimeout(() => {
          const closeBtn = overlay.querySelector('[aria-label="Close"]');
          if (closeBtn) {
            overlay.style.opacity = '';
            overlay.style.transition = '';
            overlay.style.pointerEvents = '';
            closeBtn.click();
          } else {
            overlay.remove();
          }
        }, 400);
      }

      showToast(selectedAmount, light);
    });
  }

  function handlePersonClick(e) {
    if (!extensionEnabled) return; // pass through if disabled

    e.stopImmediatePropagation();
    e.preventDefault();

    const item = e.currentTarget;
    const username = item.getAttribute('aria-label') || 'Unknown';
    const img = item.querySelector('img');
    const avatarUrl = img ? img.src : null;

    const dialog = document.querySelector('[data-testid="fui-base-sheet-content"]');
    if (!dialog) return;
    const scrollContainer = dialog.querySelector('.scroll-y') || dialog;

    const light = isLightMode(dialog);
    showAmountScreen(scrollContainer, username, avatarUrl, light);
  }

  function attachInterceptors(container) {
    container.querySelectorAll('[role="option"]').forEach(item => {
      if (item.dataset.intercepted) return;
      item.dataset.intercepted = 'true';
      item.addEventListener('click', handlePersonClick, true);
    });
  }

  function sweepExisting() {
    document.querySelectorAll('[role="listbox"]').forEach(lb => {
      if (lb.getAttribute('aria-label')?.startsWith('My friends')) {
        attachInterceptors(lb);
      }
    });
    const searchListbox = document.getElementById('user-search-listbox');
    if (searchListbox) attachInterceptors(searchListbox);
  }

  setInterval(sweepExisting, 300);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        if (node.matches('[role="listbox"]') && node.getAttribute('aria-label')?.startsWith('My friends')) {
          attachInterceptors(node);
        }

        const searchListbox = node.querySelector('#user-search-listbox');
        if (searchListbox) attachInterceptors(searchListbox);

        if (node.matches('[role="option"]') && !node.dataset.intercepted) {
          node.dataset.intercepted = 'true';
          node.addEventListener('click', handlePersonClick, true);
        }
      }

      if (mutation.target instanceof HTMLElement) {
        const t = mutation.target;
        if (
          t.id === 'user-search-listbox' ||
          (t.getAttribute('role') === 'listbox' && t.getAttribute('aria-label')?.startsWith('My friends'))
        ) {
          attachInterceptors(t);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  sweepExisting();
  setTimeout(sweepExisting, 500);
  setTimeout(sweepExisting, 1500);
})();