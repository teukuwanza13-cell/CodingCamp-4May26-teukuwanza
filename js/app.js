// Life Dashboard — app entry point

// =============================================================================
// Storage module (storage_*)
// Wraps localStorage with try/catch. All reads/writes are JSON-serialised.
// =============================================================================

let _storage_available = false;

/**
 * Checks whether localStorage is available and functional.
 * Sets the module-level `_storage_available` flag.
 * If unavailable, removes the `hidden` attribute from #storage-warning.
 * @returns {boolean}
 */
function storage_available() {
  const TEST_KEY = '__ld_storage_test__';
  try {
    localStorage.setItem(TEST_KEY, '1');
    const val = localStorage.getItem(TEST_KEY);
    localStorage.removeItem(TEST_KEY);
    if (val !== '1') throw new Error('read-back mismatch');
    _storage_available = true;
  } catch (_e) {
    _storage_available = false;
    const banner = document.getElementById('storage-warning');
    if (banner) {
      banner.removeAttribute('hidden');
    }
  }
  return _storage_available;
}

/**
 * Reads a value from localStorage and JSON-parses it.
 * Returns null on cache miss, parse error, or when storage is unavailable.
 * @param {string} key
 * @returns {any|null}
 */
function storage_get(key) {
  if (!_storage_available) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

/**
 * JSON-serialises `value` and writes it to localStorage under `key`.
 * Returns true on success, false on error or when storage is unavailable.
 * @param {string} key
 * @param {any} value
 * @returns {boolean}
 */
function storage_set(key, value) {
  if (!_storage_available) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_e) {
    return false;
  }
}

// =============================================================================
// Storage module unit tests
// Run by calling run_storage_tests() from the browser console or on page load
// during development. Uses a minimal inline test runner — no external deps.
// =============================================================================

function run_storage_tests() {
  let _passed = 0;
  let _failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log('%c PASS %c ' + name, 'color:green;font-weight:bold', 'color:inherit');
      _passed++;
    } catch (err) {
      console.error('%c FAIL %c ' + name, 'color:red;font-weight:bold', 'color:inherit', '\n', err.message || err);
      _failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        (message || 'assertEqual failed') +
        ' — expected: ' + JSON.stringify(expected) +
        ', got: ' + JSON.stringify(actual)
      );
    }
  }

  // ── Helpers to save/restore module state between tests ──────────────────────

  function withStorageAvailable(available, fn) {
    const prev = _storage_available;
    _storage_available = available;
    try { fn(); } finally { _storage_available = prev; }
  }

  // ── Test 1: storage_get returns null for corrupt JSON ───────────────────────
  test('storage_get returns null when stored value is corrupt JSON', function () {
    // Directly plant corrupt JSON into localStorage, bypassing storage_set
    const KEY = '__ld_test_corrupt__';
    withStorageAvailable(true, function () {
      try {
        localStorage.setItem(KEY, '{not valid json');
      } catch (_e) {
        // If localStorage itself is unavailable in this environment, skip gracefully
        console.warn('localStorage not available — skipping corrupt-JSON test');
        return;
      }
      const result = storage_get(KEY);
      assertEqual(result, null, 'storage_get with corrupt JSON');
      try { localStorage.removeItem(KEY); } catch (_e) { /* ignore */ }
    });
  });

  // ── Test 2: storage_set returns false when localStorage.setItem throws ──────
  test('storage_set returns false when localStorage.setItem throws', function () {
    withStorageAvailable(true, function () {
      // Temporarily replace localStorage.setItem with a throwing stub
      const original = localStorage.setItem.bind(localStorage);
      let restored = false;
      try {
        Object.defineProperty(localStorage, 'setItem', {
          configurable: true,
          writable: true,
          value: function () { throw new DOMException('QuotaExceededError'); }
        });
        const result = storage_set('__ld_test_throw__', { x: 1 });
        assertEqual(result, false, 'storage_set should return false on setItem throw');
      } finally {
        // Restore original setItem
        Object.defineProperty(localStorage, 'setItem', {
          configurable: true,
          writable: true,
          value: original
        });
        restored = true;
      }
      assert(restored, 'localStorage.setItem was not restored');
    });
  });

  // ── Test 3: storage_available shows banner when localStorage is unavailable ─
  test('storage_available shows #storage-warning banner when localStorage unavailable', function () {
    // Create a minimal mock DOM element for the banner
    const mockBanner = document.createElement('div');
    mockBanner.id = 'storage-warning';
    mockBanner.setAttribute('hidden', '');
    document.body.appendChild(mockBanner);

    // Stub localStorage to throw on setItem
    const originalSetItem = localStorage.setItem.bind(localStorage);
    let restored = false;
    try {
      Object.defineProperty(localStorage, 'setItem', {
        configurable: true,
        writable: true,
        value: function () { throw new DOMException('SecurityError'); }
      });

      // Reset flag so storage_available re-runs the check
      _storage_available = false;
      const result = storage_available();

      assertEqual(result, false, 'storage_available should return false');
      assert(
        !mockBanner.hasAttribute('hidden'),
        '#storage-warning should have hidden attribute removed'
      );
    } finally {
      Object.defineProperty(localStorage, 'setItem', {
        configurable: true,
        writable: true,
        value: originalSetItem
      });
      restored = true;
      document.body.removeChild(mockBanner);
    }
    assert(restored, 'localStorage.setItem was not restored');
  });

  // ── Test 4: storage_get returns null when storage is unavailable ─────────────
  test('storage_get returns null when _storage_available is false', function () {
    withStorageAvailable(false, function () {
      const result = storage_get('any-key');
      assertEqual(result, null, 'storage_get should return null when unavailable');
    });
  });

  // ── Test 5: storage_set returns false when storage is unavailable ────────────
  test('storage_set returns false when _storage_available is false', function () {
    withStorageAvailable(false, function () {
      const result = storage_set('any-key', { data: 1 });
      assertEqual(result, false, 'storage_set should return false when unavailable');
    });
  });

  // ── Test 6: storage_get returns null on key miss ─────────────────────────────
  test('storage_get returns null on key miss', function () {
    withStorageAvailable(true, function () {
      const KEY = '__ld_test_miss_' + Date.now() + '__';
      try { localStorage.removeItem(KEY); } catch (_e) { /* ignore */ }
      const result = storage_get(KEY);
      assertEqual(result, null, 'storage_get should return null for missing key');
    });
  });

  // ── Test 7: storage_set and storage_get round-trip ───────────────────────────
  test('storage_set and storage_get round-trip a value correctly', function () {
    withStorageAvailable(true, function () {
      const KEY = '__ld_test_roundtrip__';
      const VALUE = { hello: 'world', n: 42 };
      try {
        const setResult = storage_set(KEY, VALUE);
        assert(setResult === true, 'storage_set should return true on success');
        const getResult = storage_get(KEY);
        assert(
          getResult !== null && getResult.hello === 'world' && getResult.n === 42,
          'storage_get should return the stored value'
        );
      } finally {
        try { localStorage.removeItem(KEY); } catch (_e) { /* ignore */ }
      }
    });
  });

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(
    '%cStorage tests complete: %d passed, %d failed',
    _failed === 0 ? 'color:green;font-weight:bold' : 'color:red;font-weight:bold',
    _passed,
    _failed
  );

  return { passed: _passed, failed: _failed };
}
