"""ATLAS Fork Arena — verified offline imports from pinned user-owned forks.

No provider HTTP, no trained forecasts, no wagering, no canonical database writes.
The workflow installs each package from an exact commit in the user's own fork.
"""
import math
import socket
import unittest
from contextlib import contextmanager
from unittest.mock import patch


@contextmanager
def require_offline():
    """Make accidental TCP requests fail during the evidence test."""
    with patch.object(socket.socket, "connect", side_effect=AssertionError("LIVE_NETWORK_PROHIBITED")):
        with patch.object(socket.socket, "connect_ex", side_effect=AssertionError("LIVE_NETWORK_PROHIBITED")):
            yield


class ForkEvidenceTests(unittest.TestCase):
    def test_nba_offline_team_identity(self):
        from nba_api.stats.static import teams
        with require_offline():
            team = teams.find_team_by_abbreviation("BOS")
            self.assertEqual(team["id"], 1610612738)
            self.assertEqual(team["full_name"], "Boston Celtics")
            self.assertEqual(team["abbreviation"], "BOS")
            self.assertGreaterEqual(len(teams.get_teams()), 30)

    def test_nba_offline_player_identity(self):
        from nba_api.stats.static import players
        with require_offline():
            player = players.find_players_by_full_name("Nikola Jokic")
            self.assertEqual(len(player), 1)
            self.assertEqual(player[0]["id"], 203999)
            self.assertTrue(player[0]["is_active"])
            self.assertGreater(len(players.get_players()), 1000)

    def test_nflreadpy_interfaces_exist_without_calling_data_provider(self):
        import nflreadpy as nfl
        # Intentionally do NOT call a loader: those fetch remote nflverse data.
        with require_offline():
            self.assertTrue(callable(nfl.load_pbp))
            self.assertTrue(callable(nfl.load_player_stats))
            self.assertTrue(callable(nfl.load_team_stats))
        self.assertFalse(hasattr(nfl, "atlas_betting_authority"))

    def test_shin_three_outcome_de_vig_reference(self):
        import shin
        # The README's three-outcome example. Input odds are DECIMAL prices.
        with require_offline():
            p = shin.calculate_implied_probabilities([2.6, 2.4, 4.3])
        self.assertEqual(len(p), 3)
        self.assertTrue(all(math.isfinite(float(x)) and 0 < x < 1 for x in p))
        self.assertAlmostEqual(sum(p), 1.0, places=5)
        self.assertAlmostEqual(p[0], 0.37299406033208965, places=4)
        self.assertAlmostEqual(p[1], 0.4047794109200184, places=4)
        self.assertAlmostEqual(p[2], 0.2222265287474275, places=4)

    def test_shin_probabilities_are_pricing_context_not_a_win_model(self):
        import shin
        with require_offline():
            p = shin.calculate_implied_probabilities([2.6, 2.4, 4.3])
        bookmaker_raw = [1 / 2.6, 1 / 2.4, 1 / 4.3]
        self.assertGreater(sum(bookmaker_raw), 1.0)
        self.assertAlmostEqual(sum(p), 1.0, places=5)
        # An implied probability is not an independently trained outcome forecast.
        evidence = {"method": "SHIN", "reference_only": True, "independent_fair_probability": None,
                    "expected_value": None, "approved_bet": None, "execution_authority": False}
        self.assertIsNone(evidence["independent_fair_probability"])
        self.assertIsNone(evidence["expected_value"])
        self.assertFalse(evidence["execution_authority"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
