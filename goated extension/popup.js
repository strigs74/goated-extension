function formatRobux(n) {
  return Number(n).toLocaleString('en-US');
}

function randomBalance() {
  return Math.floor(Math.random() * (70000000 - 50000000 + 1)) + 50000000;
}

function showSaved(msg = 'Saved!') {
  const el = document.getElementById('saved-msg');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 2000);
}

// Load saved state and populate UI
chrome.storage.local.get(['enabled', 'balanceEnabled', 'fakeBalance'], (data) => {
  document.getElementById('toggle-enabled').checked  = data.enabled       !== false; // default on
  document.getElementById('toggle-balance').checked  = data.balanceEnabled !== false; // default on
  const bal = data.fakeBalance ?? 0;
  document.getElementById('balance-display').textContent = formatRobux(bal);
  document.getElementById('custom-amount').placeholder = `Current: ${formatRobux(bal)}`;
});

// Toggle: extension enabled
document.getElementById('toggle-enabled').addEventListener('change', (e) => {
  chrome.storage.local.set({ enabled: e.target.checked });
  showSaved(e.target.checked ? 'Enabled!' : 'Disabled!');
});

// Toggle: fake balance
document.getElementById('toggle-balance').addEventListener('change', (e) => {
  chrome.storage.local.set({ balanceEnabled: e.target.checked });
  showSaved();
});

// Set custom amount
document.getElementById('btn-set').addEventListener('click', () => {
  const val = parseInt(document.getElementById('custom-amount').value);
  if (isNaN(val) || val < 0) return;
  chrome.storage.local.set({ fakeBalance: val });
  document.getElementById('balance-display').textContent = formatRobux(val);
  document.getElementById('custom-amount').value = '';
  document.getElementById('custom-amount').placeholder = `Current: ${formatRobux(val)}`;
  showSaved();
});

// Random amount
document.getElementById('btn-random').addEventListener('click', () => {
  const val = randomBalance();
  chrome.storage.local.set({ fakeBalance: val });
  document.getElementById('balance-display').textContent = formatRobux(val);
  document.getElementById('custom-amount').placeholder = `Current: ${formatRobux(val)}`;
  showSaved('Randomised!');
});