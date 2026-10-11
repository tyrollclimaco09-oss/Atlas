/* Review-only status at the existing resume toolbar. Never imports remote state. */
(function () {
  'use strict';
  const host = document.getElementById('canonical-resume');
  if (!host || !globalThis.AtlasCanonicalRead) return;
  const config = globalThis.AtlasCanonicalResumeConfig;
  const bound = !!config && config.enabled === true && config.evidence === 'mock' &&
    typeof config.getBinding === 'function';
  const status = document.createElement('span');
  status.className = 'small muted';
  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'text-button';
  check.textContent = 'Check canonical candidate';
  check.disabled = !bound;
  host.append(status, check);

  const labels = {
    locally_saved: 'Private local workflow · remote state not confirmed',
    remote_confirmed: 'Remote confirmed · local draft unchanged',
    stale_conflicting: 'Stale or conflicting · local draft unchanged',
    unauthorized: 'Unauthorized · verified operator access required',
    unavailable: 'Backend unavailable · local draft unchanged',
    missing_candidate: 'Missing canonical candidate · local draft unchanged',
  };

  function render(state) {
    const evidence = bound ? 'MOCK/CONTRACT VERIFIED' : 'Live integration disabled';
    status.textContent = evidence + ' · ' + labels[state.status];
    if (state.status === 'remote_confirmed') {
      status.textContent += ' · version ' + String(state.stateVersion);
    }
  }

  // No configuration or live transport is shipped. Only injected fixtures are
  // exercised here; the mock label is not a sandbox for arbitrary injected code.
  const bridge = AtlasCanonicalRead.createBridge(bound ? {
    transport: config.transport,
    decodeCandidate: config.decodeCandidate,
    validateStateVersion: config.validateStateVersion,
    onState: render,
  } : { onState: render });
  render(bridge.getState());

  check.addEventListener('click', async function () {
    if (!bound) return;
    check.disabled = true;
    try {
      const input = config.getBinding();
      const binding = Object.freeze({ candidateKey: input?.candidateKey,
        expectedStateVersion: input?.expectedStateVersion });
      await bridge.check(binding);
      const after = config.getBinding();
      if (binding?.candidateKey !== after?.candidateKey ||
          !Object.is(binding?.expectedStateVersion, after?.expectedStateVersion)) {
        bridge.invalidate();
      }
    } catch {
      bridge.invalidate();
    } finally {
      check.disabled = false;
    }
  });

  // Editing/selection/restore/new-run changes clear observed proof immediately.
  // Observe original controls without reading, writing or persisting their data.
  const invalidate = () => {
    if (bound && bridge.getState().reason !== 'NOT_CHECKED') bridge.invalidate();
  };
  document.getElementById('slate')?.addEventListener('input', invalidate);
  document.getElementById('slate')?.addEventListener('change', invalidate);
  document.getElementById('slate')?.addEventListener('click', event => {
    if (host.contains(event.target)) return;
    invalidate();
  });
  for (const id of ['new-slate-form', 'import-dialog', 'revision-form',
    'disposition-form', 'reopen-form', 'paste-stage-dialog']) {
    const element = document.getElementById(id);
    element?.addEventListener('input', invalidate);
    element?.addEventListener('change', invalidate);
    element?.addEventListener('submit', invalidate);
    element?.addEventListener('click', invalidate);
  }
  document.addEventListener('visibilitychange', invalidate);
  window.addEventListener('pageshow', invalidate);
})();
