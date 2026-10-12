export type SavedBuild = {
  id: string;
  name: string;
  sourceDataUrl: string;
  previewUrl: string;
  colorId: string;
  colorName: string;
  finish: string;
  notes: string;
  savedAt: number;
};

const DATABASE_NAME = "wrap-studio-local";
const DATABASE_VERSION = 1;
const STORE_NAME = "builds";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Local browser storage is unavailable."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local builds."));
  });
}

export async function listSavedBuilds(): Promise<SavedBuild[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as SavedBuild[]).sort((a, b) => b.savedAt - a.savedAt));
    request.onerror = () => reject(request.error ?? new Error("Could not load saved builds."));
  });
}

export async function saveBuild(build: SavedBuild): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(build);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save this build locally."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Saving this build was cancelled."));
  });
}

export async function removeSavedBuild(id: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not remove this local build."));
  });
}
