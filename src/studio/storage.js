// Keeps the video and sound files in the browser's own database, so a refresh does not lose them.
// Nothing is uploaded: the files stay on this device, in this browser.
const DB_NAME = 'rankreel';
const STORE = 'files';

let opening;

function open() {
  opening ||= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return opening;
}

async function withStore(mode, work) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = work(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error ?? request.error);
    transaction.onabort = () => reject(transaction.error ?? request.error);
  });
}

export function readFile(key) {
  return withStore('readonly', (store) => store.get(key));
}

let wanted = new Map();
let queue = Promise.resolve();
// Files other videos still need, looked up when a sync runs. Set by the saved-video list.
let alsoKeep = () => new Set();

export function keepAlso(keys) {
  alsoKeep = keys;
}

async function sync() {
  const keep = wanted;
  const also = alsoKeep();
  const saved = new Set(await withStore('readonly', (store) => store.getAllKeys()));
  for (const key of saved) {
    if (!keep.has(key) && !also.has(key)) await withStore('readwrite', (store) => store.delete(key));
  }
  for (const [key, file] of keep) {
    if (!saved.has(key)) await withStore('readwrite', (store) => store.put(file, key));
  }
  // Asks the browser not to clear these files when the disk gets tight. It may say no; that is fine.
  if (keep.size) navigator.storage?.persist?.().catch(() => {});
}

// Makes the saved files match `files` (a Map of key to File): new ones are written, unused ones removed.
// Calls run one after another, and each works from the latest list, so a quick add-then-remove cannot
// leave a file behind.
export function keepFiles(files) {
  wanted = files;
  return syncFiles();
}

export function syncFiles() {
  queue = queue.catch(() => {}).then(sync);
  return queue;
}
