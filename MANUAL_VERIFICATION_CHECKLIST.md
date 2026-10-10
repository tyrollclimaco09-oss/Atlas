# Manual Verification Checklist

Project: ATLAS × OmniRoute
Branch: `feature/omniroute-codespaces-gateway`

Status legend:
- NOT RUN = not executed in this environment
- PASS = evidence confirms the check
- FAIL = evidence contradicts the expectation
- BLOCKED = environment or access constraints prevented completion

## Evidence fields
- Date/time:
- Operator:
- Codespace URL:
- Port 20128 visibility:
- Screenshot or log reference:

---

## 1. Repository preservation
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 2. Node.js 24 environment
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 3. `npm view omniroute@3.8.52` verification
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 4. Runtime secret generation in `.omniroute/.env`
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 5. Port 20128 private-only configuration
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 6. OmniRoute startup status
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 7. `GET /healthz`
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 8. Anonymous access to `/api/omniroute/status`
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 9. Authenticated access to `/api/omniroute/status`
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 10. `POST /api/omniroute/route/preview`
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 11. Synthetic preview only
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 12. Upstream model calls count
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 13. Paid provider / unknown-cost provider eligibility
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 14. Automatic provider fallback disabled
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Evidence:

## 15. Final outcome
- [ ] NOT RUN / PASS / FAIL / BLOCKED
- Notes:
