(function (root) {
  'use strict';
  function calculatePrice(oddsInput, probabilityInput = '') {
    const raw = String(oddsInput).trim().replace(/−/g, '-');
    if (!/^[+-]?\d+(\.\d+)?$/.test(raw)) throw new Error('Enter valid American odds, such as +113 or -110.');
    const odds = Number(raw);
    if (!Number.isFinite(odds) || Math.abs(odds) < 100 || Math.abs(odds) > 1000000) throw new Error('American odds must be at least +100 or at most -100 (maximum magnitude 1,000,000).');
    const decimal = odds > 0 ? 1 + odds / 100 : 1 + 100 / -odds;
    const probabilityRaw = String(probabilityInput).trim();
    let probability = null;
    if (probabilityRaw !== '') {
      probability = Number(probabilityRaw) / 100;
      if (!Number.isFinite(probability) || probability <= 0 || probability >= 1) throw new Error('Fair probability must be greater than 0% and less than 100%.');
    }
    const fairOdds = probability === null ? null : probability > 0.5 ? -100 * probability / (1 - probability) : 100 * (1 - probability) / probability;
    return { decimal, breakEven: 1 / decimal, fairOdds, expected: probability === null ? null : probability * decimal - 1 };
  }
  root.AtlasPricing = { calculatePrice };
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculatePrice };
})(typeof globalThis !== 'undefined' ? globalThis : this);
