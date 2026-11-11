import { load, type State } from '../logic/state.ts';

const SAVE_KEY = 'cat-capitalist-save';

export function readSave(): State {
  try {
    return load(localStorage.getItem(SAVE_KEY));
  } catch {
    return load(null); // storage blocked
  }
}

export function writeSave(s: State) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // storage full or blocked: game keeps running, progress just isn't persisted
  }
}

/** Wipes every Cat Capitalist key from localStorage (the save and anything older). */
export function clearSave() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith('cat-capitalist')) localStorage.removeItem(key);
  } catch {
    // storage blocked: nothing to clear
  }
}
