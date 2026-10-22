# NBA: October 22 shot-forensics checkpoint

**Authority: shadow research only.** Source game ESPN `401909834`, Oct 21 Atlanta–Orlando. No betting or model promotion.

- Real [trace run 39851620052](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39851620052) passed two offline checks and fetched one live response. Body hash: `8b0195d1c89bc78cdb01631fa62dbdfd5248dd040106c1ecd3f3494fdabbc288`.
- The 175 field-goal attempt candidates reconcile in **total**, not by team. Team 1 official 90 vs PBP 89; team 19 official 85 vs PBP 86.
- Dyson Daniels: player `4869342`, official **13**, event-extracted **12**; one missing. Jalen Suggs: `4432165`, official **8**, event-extracted **9**.
- Suspect boundary event: Suggs missed `Heave Jump Shot` at **Q1 0:00**, event `401909834198`. May not count officially but **not yet corroborated**. Keep rule blocked pending separate independent event proof.
- Challenge/review sequences seen: `401909834532/533` at Q3 3:32; `401909834723/725` at Q4 4:27. No proven causal relationship with FGA discrepancy.
- Every candidate shooter maps to a roster/team; blindly switching team IDs would be wrong. Multiple requests can have different raw response hashes; hash is point-in-time receipt.
- ESPN public endpoint is unofficial and its licensing/stability is unverified. Original V3 57-game replay archive still inaccessible as bytes.

**Gate:** no Q4 FGA feature admission, retrospective replay promotion, or odds/EV claim. Next: separately verified shot/event source for BOTH player discrepancies; only then adjudicate and rerun per-player reconciliation.
