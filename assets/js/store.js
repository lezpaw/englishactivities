/* ===========================================================================
   store.js — profiles + per-student progress, persisted in localStorage.

   Design notes
   - No server, no login. A teacher can hand out a link (or a folder) and a
     student just picks their name. Several students can share one device.
   - Everything is namespaced under one root key so it is easy to export,
     wipe, or move to a backend later without touching the activity code.
   =========================================================================== */

(function () {
  'use strict';

  const ROOT = 'englishactivities.v1';

  function blankState() {
    return { profiles: [], activeId: null, data: {} };
  }

  function read() {
    try {
      const raw = localStorage.getItem(ROOT);
      if (!raw) return blankState();
      const parsed = JSON.parse(raw);
      // Defensive: a half-written or hand-edited blob should not brick the app.
      if (!parsed || typeof parsed !== 'object') return blankState();
      parsed.profiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
      parsed.data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
      return parsed;
    } catch (e) {
      return blankState();
    }
  }

  function write(state) {
    try {
      localStorage.setItem(ROOT, JSON.stringify(state));
      return true;
    } catch (e) {
      // Private windows and "block site data" settings both land here.
      return false;
    }
  }

  let state = read();

  const Store = {
    /* ---- profiles ------------------------------------------------------- */
    profiles() {
      return state.profiles.slice();
    },

    activeProfile() {
      return state.profiles.find(p => p.id === state.activeId) || null;
    },

    addProfile(name) {
      const clean = String(name || '').trim().slice(0, 40);
      if (!clean) return null;
      const existing = state.profiles.find(
        p => p.name.toLowerCase() === clean.toLowerCase()
      );
      if (existing) {
        state.activeId = existing.id;
        write(state);
        return existing;
      }
      const profile = {
        id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: clean,
        createdAt: new Date().toISOString()
      };
      state.profiles.push(profile);
      state.activeId = profile.id;
      write(state);
      return profile;
    },

    setActive(id) {
      if (state.profiles.some(p => p.id === id)) {
        state.activeId = id;
        write(state);
        return true;
      }
      return false;
    },

    signOut() {
      state.activeId = null;
      write(state);
    },

    removeProfile(id) {
      state.profiles = state.profiles.filter(p => p.id !== id);
      Object.keys(state.data).forEach(key => {
        if (key.indexOf(id + '::') === 0) delete state.data[key];
      });
      if (state.activeId === id) state.activeId = null;
      write(state);
    },

    /* ---- progress ------------------------------------------------------- */
    // One bucket per (profile, pack). Shape:
    //   { words: {word: rec}, activities: {key: {...}}, diagnostic: {...},
    //     sessions: [isoDate, ...] }
    progress(packId) {
      const profile = this.activeProfile();
      if (!profile) return null;
      const key = profile.id + '::' + packId;
      if (!state.data[key]) {
        state.data[key] = { words: {}, activities: {}, diagnostic: null, sessions: [] };
      }
      const bucket = state.data[key];
      bucket.words = bucket.words || {};
      bucket.activities = bucket.activities || {};
      bucket.sessions = bucket.sessions || [];
      return bucket;
    },

    save() {
      return write(state);
    },

    /* ---- housekeeping --------------------------------------------------- */
    // Records that the student opened the pack today (drives the streak).
    touchSession(packId) {
      const bucket = this.progress(packId);
      if (!bucket) return;
      const today = new Date().toISOString().slice(0, 10);
      if (bucket.sessions[bucket.sessions.length - 1] !== today) {
        bucket.sessions.push(today);
        if (bucket.sessions.length > 400) bucket.sessions.shift();
        write(state);
      }
    },

    exportJSON() {
      return JSON.stringify(state, null, 2);
    },

    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.profiles)) throw new Error('Not a valid backup file.');
      state = parsed;
      write(state);
    },

    resetPack(packId) {
      const profile = this.activeProfile();
      if (!profile) return;
      delete state.data[profile.id + '::' + packId];
      write(state);
    },

    // True when the browser refuses to persist (private mode, blocked storage).
    storageAvailable() {
      try {
        localStorage.setItem(ROOT + '.probe', '1');
        localStorage.removeItem(ROOT + '.probe');
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  window.EA = window.EA || {};
  window.EA.Store = Store;
})();
