"""
Core statistical engine for A/B test analysis.

Implements:
- Two-proportion z-test (for conversion rate experiments)
- Welch's t-test (for continuous metrics like revenue, time-on-page)
- Statistical power / minimum sample size calculation
- Sequential testing bounds (to avoid "peeking" problems)
"""

from dataclasses import dataclass
from typing import Literal
import math

from scipy import stats
import numpy as np


@dataclass
class ExperimentResult:
    metric_name: str
    control_n: int
    treatment_n: int
    control_mean: float
    treatment_mean: float
    relative_lift: float
    p_value: float
    is_significant: bool
    confidence_interval: tuple[float, float]
    test_used: str
    alpha: float = 0.05

    def summary(self) -> str:
        sig = "SIGNIFICANT" if self.is_significant else "not significant"
        return (
            f"[{self.metric_name}] control={self.control_mean:.4f} "
            f"treatment={self.treatment_mean:.4f} "
            f"lift={self.relative_lift * 100:.2f}% "
            f"p={self.p_value:.4f} ({sig}, alpha={self.alpha}) "
            f"via {self.test_used}"
        )


def two_proportion_ztest(
    control_successes: int,
    control_n: int,
    treatment_successes: int,
    treatment_n: int,
    alpha: float = 0.05,
    metric_name: str = "conversion_rate",
) -> ExperimentResult:
    """Two-proportion z-test, standard for conversion-rate style metrics."""
    p1 = control_successes / control_n
    p2 = treatment_successes / treatment_n
    p_pool = (control_successes + treatment_successes) / (control_n + treatment_n)

    se_pooled = math.sqrt(p_pool * (1 - p_pool) * (1 / control_n + 1 / treatment_n))
    if se_pooled == 0:
        z = 0.0
    else:
        z = (p2 - p1) / se_pooled

    p_value = 2 * (1 - stats.norm.cdf(abs(z)))

    se_diff = math.sqrt(
        p1 * (1 - p1) / control_n + p2 * (1 - p2) / treatment_n
    )
    z_crit = stats.norm.ppf(1 - alpha / 2)
    diff = p2 - p1
    ci = (diff - z_crit * se_diff, diff + z_crit * se_diff)

    relative_lift = (p2 - p1) / p1 if p1 != 0 else float("inf")

    return ExperimentResult(
        metric_name=metric_name,
        control_n=control_n,
        treatment_n=treatment_n,
        control_mean=p1,
        treatment_mean=p2,
        relative_lift=relative_lift,
        p_value=p_value,
        is_significant=p_value < alpha,
        confidence_interval=ci,
        test_used="two-proportion z-test",
        alpha=alpha,
    )


def welch_ttest(
    control_values: list[float],
    treatment_values: list[float],
    alpha: float = 0.05,
    metric_name: str = "continuous_metric",
) -> ExperimentResult:
    """Welch's t-test: doesn't assume equal variances, safer default than Student's t-test."""
    control_arr = np.asarray(control_values, dtype=float)
    treatment_arr = np.asarray(treatment_values, dtype=float)

    t_stat, p_value = stats.ttest_ind(treatment_arr, control_arr, equal_var=False)

    mean_c, mean_t = control_arr.mean(), treatment_arr.mean()
    se = math.sqrt(control_arr.var(ddof=1) / len(control_arr) + treatment_arr.var(ddof=1) / len(treatment_arr))
    dof = stats.ttest_ind(treatment_arr, control_arr, equal_var=False).df if hasattr(t_stat, "df") else _welch_dof(control_arr, treatment_arr)
    t_crit = stats.t.ppf(1 - alpha / 2, dof)
    diff = mean_t - mean_c
    ci = (diff - t_crit * se, diff + t_crit * se)

    relative_lift = (mean_t - mean_c) / mean_c if mean_c != 0 else float("inf")

    return ExperimentResult(
        metric_name=metric_name,
        control_n=len(control_arr),
        treatment_n=len(treatment_arr),
        control_mean=mean_c,
        treatment_mean=mean_t,
        relative_lift=relative_lift,
        p_value=p_value,
        is_significant=p_value < alpha,
        confidence_interval=ci,
        test_used="Welch's t-test",
        alpha=alpha,
    )


def _welch_dof(a: np.ndarray, b: np.ndarray) -> float:
    va, vb = a.var(ddof=1), b.var(ddof=1)
    na, nb = len(a), len(b)
    numerator = (va / na + vb / nb) ** 2
    denominator = (va ** 2) / ((na ** 2) * (na - 1)) + (vb ** 2) / ((nb ** 2) * (nb - 1))
    return numerator / denominator


def required_sample_size(
    baseline_rate: float,
    minimum_detectable_effect: float,
    alpha: float = 0.05,
    power: float = 0.8,
) -> int:
    """
    Minimum per-group sample size for a two-proportion test.

    baseline_rate: current conversion rate (e.g. 0.10 for 10%)
    minimum_detectable_effect: smallest relative lift worth detecting (e.g. 0.05 for 5%)
    """
    p1 = baseline_rate
    p2 = baseline_rate * (1 + minimum_detectable_effect)

    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta = stats.norm.ppf(power)

    pooled = (p1 + p2) / 2
    numerator = (
        z_alpha * math.sqrt(2 * pooled * (1 - pooled))
        + z_beta * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
    ) ** 2
    denominator = (p2 - p1) ** 2

    return math.ceil(numerator / denominator)


def sequential_test_boundary(alpha: float, look_number: int, total_looks: int) -> float:
    """
    Simple O'Brien-Fleming style alpha-spending boundary approximation.
    Makes early "peeks" at results stricter, avoiding inflated false-positive rates.
    """
    fraction = look_number / total_looks
    z_boundary = stats.norm.ppf(1 - alpha / 2) / math.sqrt(fraction)
    return z_boundary
