"""
Unit tests for src.experiment

Run with: pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from src.experiment import (
    two_proportion_ztest,
    welch_ttest,
    required_sample_size,
    sequential_test_boundary,
)
from src.simulate import simulate_conversion_experiment, simulate_continuous_experiment


def test_two_proportion_ztest_detects_no_difference():
    result = two_proportion_ztest(
        control_successes=500,
        control_n=1000,
        treatment_successes=505,
        treatment_n=1000,
    )
    assert not result.is_significant


def test_two_proportion_ztest_detects_large_difference():
    result = two_proportion_ztest(
        control_successes=100,
        control_n=1000,
        treatment_successes=200,
        treatment_n=1000,
    )
    assert result.is_significant
    assert result.relative_lift > 0


def test_welch_ttest_basic():
    control = [10.1, 9.8, 10.3, 9.9, 10.0, 10.2, 9.7, 10.1]
    treatment = [12.5, 12.1, 12.8, 12.3, 12.0, 12.6, 12.4, 12.2]
    result = welch_ttest(control, treatment)
    assert result.is_significant
    assert result.treatment_mean > result.control_mean


def test_required_sample_size_reasonable_range():
    n = required_sample_size(baseline_rate=0.10, minimum_detectable_effect=0.10)
    assert 1000 < n < 100000


def test_sequential_test_boundary_stricter_early():
    early = sequential_test_boundary(alpha=0.05, look_number=1, total_looks=5)
    late = sequential_test_boundary(alpha=0.05, look_number=5, total_looks=5)
    assert early > late


def test_simulation_reproducible_with_seed():
    result_a = simulate_conversion_experiment(0.1, 0.12, 1000, seed=42)
    result_b = simulate_conversion_experiment(0.1, 0.12, 1000, seed=42)
    assert result_a == result_b


def test_continuous_simulation_shape():
    result = simulate_continuous_experiment(50, 55, 10, 200, seed=1)
    assert len(result["control_values"]) == 200
    assert len(result["treatment_values"]) == 200
