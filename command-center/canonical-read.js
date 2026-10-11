/* Injectable, read-only candidate bridge. No built-in endpoint or credentials. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AtlasCanonicalRead = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  function decodeCandidate(payload) {
    if (!payload || payload.ok !== true || payload.mode !== 'candidate' ||
        payload.human_final_gate_required !== true || payload.execution_authority !== false ||
        !Object.hasOwn(payload, 'data')) {
      throw new Error('Candidate response contract rejected');
    }
    if (payload.data === null) return null;
    const row = payload.data;
    if (!row || typeof row !== 'object' || Array.isArray(row) ||
        !Object.hasOwn(row, 'candidate_key') || !Object.hasOwn(row, 'state_version')) {
      throw new Error('Candidate identity/version missing');
    }
    // Minimal projection only. No row hydration, authority or persistence.
    return { candidateKey: row.candidate_key, stateVersion: row.state_version };
  }

  function candidateRequestURL(endpoint, candidateKey) {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search ||
        url.origin !== 'https://lhliqbbooproqtslmgqi.supabase.co' ||
        url.pathname !== '/functions/v1/atlas-site-runtime' ||
        typeof candidateKey !== 'string' || !candidateKey.trim()) {
      throw new Error('Verified candidate endpoint and key required');
    }
    url.searchParams.set('mode', 'candidate');
    url.searchParams.set('candidate_key', candidateKey.trim());
    return url.href;
  }

  function createBridge(options = {}) {
    const { transport, validateStateVersion, onState } = options;
    const decode = options.decodeCandidate ?? decodeCandidate;
    let generation = 0;
    let state = Object.freeze({ status: 'locally_saved', reason: 'NOT_CHECKED' });

    function publish(status, reason, proof) {
      state = Object.freeze({ status, reason, ...proof });
      if (typeof onState === 'function') onState(state);
      return state;
    }

    function validVersion(value) {
      // SQL type/nullability is unknown. The owner must bind a strict validator;
      // never parse, stringify, increment or silently coerce the selected value.
      const scalar = typeof value === 'string' || typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value) &&
          (!Number.isInteger(value) || Number.isSafeInteger(value)));
      return scalar &&
        validateStateVersion(value) === true;
    }

    function invalidate() {
      generation += 1;
      return publish('stale_conflicting', 'BINDING_INVALIDATED');
    }

    async function check(binding) {
      const requestGeneration = ++generation;
      // Capture values before awaiting; never retain a mutable binding object.
      const candidateKey = typeof binding?.candidateKey === 'string'
        ? binding.candidateKey.trim() : binding?.candidateKey;
      const expectedStateVersion = binding?.expectedStateVersion;
      const current = () => requestGeneration === generation;
      const finish = (status, reason, proof) => current()
        ? publish(status, reason, proof) : state;

      publish('locally_saved', 'CHECKING_REMOTE');
      if (typeof transport !== 'function' || typeof decode !== 'function' ||
          typeof validateStateVersion !== 'function') {
        return finish('unavailable', 'CONTRACT_NOT_BOUND');
      }
      try {
        if (typeof candidateKey !== 'string' || !candidateKey.trim()) {
          return finish('missing_candidate', 'CANDIDATE_KEY_REQUIRED');
        }
        if (!validVersion(expectedStateVersion)) {
          return finish('stale_conflicting', 'EXPECTED_VERSION_REQUIRED_OR_INVALID');
        }
        // This is an INTERNAL transport descriptor, not a guessed wire envelope.
        const request = Object.freeze({
          method: 'GET', mode: 'candidate', candidate_key: candidateKey,
        });
        const response = await transport(request);
        if (!current()) return state;
        if (response?.status === 401 || response?.status === 403) {
          return finish('unauthorized', 'OPERATOR_AUTH_REQUIRED');
        }
        if (response?.status !== 200 || typeof response.json !== 'function') {
          return finish('unavailable', response?.status === 400
            ? 'REQUEST_REJECTED' : 'READ_UNAVAILABLE');
        }
        const payload = await response.json();
        if (!current()) return state;
        const identity = decode(payload);
        if (!current()) return state;
        if (identity === null) return finish('missing_candidate', 'REMOTE_CANDIDATE_MISSING');
        if (!identity || typeof identity.candidateKey !== 'string' ||
            !validVersion(identity.stateVersion)) {
          return finish('unavailable', 'RESPONSE_CONTRACT_INVALID');
        }
        if (identity.candidateKey !== candidateKey) {
          return finish('stale_conflicting', 'CANDIDATE_IDENTITY_MISMATCH');
        }
        if (!Object.is(identity.stateVersion, expectedStateVersion)) {
          return finish('stale_conflicting', 'STATE_VERSION_CHANGED');
        }
        return finish('remote_confirmed', 'IDENTITY_AND_VERSION_MATCH', {
          candidateKey, stateVersion: identity.stateVersion,
        });
      } catch {
        // Response bodies, decoder exceptions and credential-bearing errors stay private.
        return finish('unavailable', 'READ_OR_CONTRACT_FAILED');
      }
    }

    return Object.freeze({ check, invalidate, getState: () => state });
  }

  return Object.freeze({ createBridge, decodeCandidate, candidateRequestURL });
});
