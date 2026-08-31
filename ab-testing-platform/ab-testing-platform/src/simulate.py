"""
Simulate synthetic A/B test data.

Useful for demoing the platform, testing statistical code against known
ground truth, and running power-analysis sanity checks.
"""

import numpy as np


def simulate_conversion_experiment(
    control_rate: float,
    treatment_rate: float,
    n_per_group: int,
    seed: int | None = None,
) -> dict:
    """Simulate binary conversion outcomes for control/treatment groups."""
    rng = np.random.default_rng(seed)
    control = rng.binomial(1, control_rate, n_per_group)
    treatment = rng.binomial(1, treatment_rate, n_per_group)
    return {
        "control_successes": int(control.sum()),
        "control_n": n_per_group,
        "treatment_successes": int(treatment.sum()),
        "treatment_n": n_per_group,
    }


def simulate_continuous_experiment(
    control_mean: float,
    treatment_mean: float,
    std_dev: float,
    n_per_group: int,
    seed: int | None = None,
) -> dict:
    """Simulate continuous outcomes (e.g. revenue per user, session length)."""
    rng = np.random.default_rng(seed)
    control = rng.normal(control_mean, std_dev, n_per_group).clip(min=0)
    treatment = rng.normal(treatment_mean, std_dev, n_per_group).clip(min=0)
    return {
        "control_values": control.tolist(),
        "treatment_values": treatment.tolist(),
    }
