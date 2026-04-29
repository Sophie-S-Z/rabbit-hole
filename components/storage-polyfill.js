// Polyfill for window.storage (Claude artifact API) using localStorage.
// Matches the async interface: get(key) => {key, value}, set(key, value), delete(key), list(prefix)

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: function(key) {
      return new Promise(function(resolve, reject) {
        try {
          var value = localStorage.getItem(key);
          if (value !== null) {
            resolve({ key: key, value: value, shared: false });
          } else {
            reject(new Error('Key not found: ' + key));
          }
        } catch (e) {
          reject(e);
        }
      });
    },
    set: function(key, value) {
      return new Promise(function(resolve, reject) {
        try {
          localStorage.setItem(key, value);
          resolve({ key: key, value: value, shared: false });
        } catch (e) {
          reject(e);
        }
      });
    },
    delete: function(key) {
      return new Promise(function(resolve) {
        try {
          localStorage.removeItem(key);
          resolve({ key: key, deleted: true, shared: false });
        } catch (e) {
          resolve({ key: key, deleted: false, shared: false });
        }
      });
    },
    list: function(prefix) {
      return new Promise(function(resolve) {
        try {
          var keys = [];
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!prefix || k.indexOf(prefix) === 0) {
              keys.push(k);
            }
          }
          resolve({ keys: keys, shared: false });
        } catch (e) {
          resolve({ keys: [], shared: false });
        }
      });
    }
  };
}
