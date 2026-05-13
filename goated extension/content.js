(function () {
  'use strict';

  const FAKE_BALANCE = Math.floor(Math.random() * (70000000 - 50000000 + 1)) + 50000000;
  let currentBalance = FAKE_BALANCE;

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

  function updateBalanceDisplays() {
    const formatted = formatRobux(currentBalance);
    const nav = document.getElementById('nav-robux-amount');
    if (nav) nav.textContent = formatted;
    document.querySelectorAll('span').forEach(span => {
      if (isBalanceSpan(span) && /^[\d,]+$/.test(span.textContent.trim())) {
        span.textContent = formatted;
      }
    });
  }

  const balanceObserver = new MutationObserver(() => {
    document.querySelectorAll('span').forEach(span => {
      if (isBalanceSpan(span) && /^[\d,]+$/.test(span.textContent.trim())) {
        const formatted = formatRobux(currentBalance);
        if (span.textContent.trim() !== formatted) span.textContent = formatted;
      }
    });
  });
  balanceObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

  function robuxIcon(size) {
    return `<span role="presentation" class="grow-0 shrink-0 basis-auto icon icon-regular-robux" style="font-size:${size}px;width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;"></span>`;
  }

  let originalScrollHTML = null;

  function showToast(amount) {
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
          background: #ffffff;
          color: #111;
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
          background: #111;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        #fake-robux-toast .toast-check svg {
          width: 11px; height: 11px;
        }
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
          <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
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

  function showAmountScreen(scrollContainer, username, avatarUrl) {
    let selectedAmount = 0;

    // We don't want to restore the HTML anymore if we are closing it,
    // so we can skip the originalScrollHTML logic here if you prefer a clean exit.

    scrollContainer.innerHTML = `
      <style id="fake-screen-styles">
        .fake-amt-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgb(47, 49, 55);
          border: none;
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-radius: 8px;
          padding: 10px 18px;
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          min-width: 72px;
          justify-content: center;
          transition: background 0.1s, outline-color 0.1s;
        }
        .fake-amt-btn.selected {
          background: rgb(24, 26, 32);
          outline-color: #ffffff;
        }
        #fake-custom-number {
          width: 100%;
          background: rgb(47, 49, 55);
          border: none;
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-radius: 8px;
          padding: 12px 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          box-sizing: border-box;
          transition: outline-color 0.1s, background 0.1s;
        }
        #fake-custom-number:focus {
          outline-color: #ffffff;
          background: rgb(24, 26, 32);
        }
        #fake-custom-number::placeholder { color: #888; }
        #fake-next-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: none;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: default;
          background: #2a3a7a;
          opacity: 0.6;
          transition: background 0.15s, opacity 0.15s;
        }
        #fake-next-btn.active {
          background: #3b5bdb;
          opacity: 1;
          cursor: pointer;
        }
        /* Fade out the entire overlay container */
        .fade-out-entirely {
          opacity: 0 !important;
          transition: opacity 0.4s ease-out !important;
          pointer-events: none !important;
        }
      </style>
      <div id="fake-amount-screen" style="display: flex; flex-direction: column; align-items: center; padding: 24px 32px 32px; gap: 20px; min-height: 40vh;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;background:#3a3a60;">
            ${avatarUrl ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:22px;">👤</div>`}
          </div>
          <span style="color:#fff;font-size:15px;font-weight:600;">${username}</span>
        </div>

        <div style="display:flex;align-items:center;gap:10px;">
          ${robuxIcon(28)}
          <span id="fake-amount-display" style="color:#fff;font-size:36px;font-weight:700;line-height:1;">0</span>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;width:100%;">
          ${[25, 50, 100, 200].map(amt => `<button class="fake-amt-btn" data-amount="${amt}">${robuxIcon(14)} ${amt}</button>`).join('')}
        </div>

        <div style="width:100%;">
          <input id="fake-custom-number" type="number" min="1" placeholder="Custom Amount..." />
        </div>

        <button id="fake-next-btn">Send Robux</button>
        <span style="color:#888;font-size:12px;">Robux are sent instantly with no fees</span>
      </div>
    `;

    const nextBtn = scrollContainer.querySelector('#fake-next-btn');
    const amountDisplay = scrollContainer.querySelector('#fake-amount-display');
    const customInput = scrollContainer.querySelector('#fake-custom-number');

    function setAmount(val) {
      selectedAmount = val;
      amountDisplay.textContent = val > 0 ? formatRobux(val) : '0';
      if (val > 0) {
        nextBtn.classList.add('active');
      } else {
        nextBtn.classList.remove('active');
      }
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
      
      // 1. Update Balance
      currentBalance = Math.max(0, currentBalance - selectedAmount);
      updateBalanceDisplays();

      // 2. Find the DARK OVERLAY (the darkness thingy)
      const overlay = document.querySelector('[data-testid="fui-base-sheet-overlay"]');
      
      if (overlay) {
        // Apply fade class to the background darkness
        overlay.classList.add('fade-out-entirely');
        
        // 3. Clean up and Close
        setTimeout(() => {
          // Find the real Roblox close button inside the overlay and click it
          const closeBtn = overlay.querySelector('[aria-label="Close"]');
          if (closeBtn) {
            closeBtn.click();
          } else {
            overlay.remove(); // Fallback if button isn't found
          }
          // Reset internal state
          originalScrollHTML = null;
        }, 400);
      }

      showToast(selectedAmount);
    });
  }

  function handlePersonClick(e) {
    e.stopImmediatePropagation();
    e.preventDefault();

    const item = e.currentTarget;
    const username = item.getAttribute('aria-label') || 'Unknown';
    const img = item.querySelector('img');
    const avatarUrl = img ? img.src : null;

    const dialog = document.querySelector('[data-testid="fui-base-sheet-content"]');
    if (!dialog) return;
    const scrollContainer = dialog.querySelector('.scroll-y') || dialog;
    
    showAmountScreen(scrollContainer, username, avatarUrl);
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
  sweepExisting();
})();