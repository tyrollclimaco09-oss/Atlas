#!/usr/bin/env python3
"""Use the ACTUAL forked shin method as a bookmaker reference benchmark.

All odds below are synthetic bookmaker price fixtures. These calculations do
not produce a model's independent fair probability, positive EV or a wager.
"""
from __future__ import annotations
import json
import math

import shin


def american_to_decimal(price: int) -> float:
    if abs(price) < 100:
        raise ValueError("INVALID_AMERICAN_PRICE")
    return 1.0 + (price / 100 if price > 0 else 100 / -price)


def compare(name: str, american: list[int]) -> dict:
    decimal = [american_to_decimal(p) for p in american]
    raw = [1 / p for p in decimal]
    overround = sum(raw)
    if overround <= 1 or overround > 1.5:
        raise ValueError("NOT_A_REALISTIC_BOOK_OVERROUND")
    simple = [x / overround for x in raw]
    result = shin.calculate_implied_probabilities(odds=decimal, full_output=True)
    predicted = [float(x) for x in result.implied_probabilities]
    assert len(predicted) == len(simple)
    assert all(math.isfinite(x) and 0 <= x <= 1 for x in predicted)
    assert abs(sum(predicted) - 1) < 1e-6
    return {
        "name": name,
        "fixture_type": "SYNTHETIC_BOOKMAKER_PRICE_NOT_CURRENT_ODDS",
        "american_prices": american,
        "overround": round(overround, 9),
        "market_derived_multiplicative": [round(x, 8) for x in simple],
        "market_derived_shin": [round(x, 8) for x in predicted],
        "max_delta_from_multiplicative": round(max(abs(a - b) for a, b in zip(predicted, simple)), 8),
        "shin_insider_fraction_z": round(float(result.z), 9),
        "independent_fair_probability": None,
        "expected_value": None,
        "execution_authority": False,
        "approved_bet": None,
    }


def main() -> None:
    cases = [
        compare("two_way_symmetric", [-110, -110]),
        compare("three_way_asymmetric", [140, 220, -105]),
    ]
    print(json.dumps({
        "contract": "ATLAS_FORK_SHIN_PRICE_REFERENCE_SMOKE_V1",
        "fork": "tyrollclimaco09-oss/shin",
        "source_execution": "ACTUAL_FORK_PACKAGE_METHOD",
        "inputs_current_sportsbook": False,
        "provider_api_calls": 0,
        "independent_model_predictions": 0,
        "betting_actions": 0,
        "cases": cases,
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
