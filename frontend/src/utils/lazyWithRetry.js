import { lazy } from 'react';

const RELOAD_KEY = 'tl-chunk-reload-at';

export const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '');
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|is not a valid JavaScript MIME type|Loading chunk [\w-]+ failed/i.test(message);
};

// A new deploy replaces the hashed page files. A tab (or cached index.html) from the previous
// deploy then asks for files that no longer exist. Reload once to pick up the new build;
// the timestamp stops a reload loop if the files are genuinely unreachable.
export const reloadForFreshBuild = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage blocked: still try once
  }
  window.location.reload();
  return true;
};

export default function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      if (!isChunkLoadError(firstError)) throw firstError;
      // brief retry covers a flaky network before we give up and reload
      await new Promise((resolve) => setTimeout(resolve, 600));
      try {
        return await factory();
      } catch (secondError) {
        if (isChunkLoadError(secondError) && reloadForFreshBuild()) {
          return new Promise(() => {}); // page is reloading
        }
        throw secondError;
      }
    }
  });
}
