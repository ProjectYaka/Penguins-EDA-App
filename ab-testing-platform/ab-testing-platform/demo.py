"""
End-to-end demo: simulate an experiment, then analyze it.

Run with: python demo.py
"""

from src.simulate import simulate_conversion_experiment, simulate_continuous_experiment
from src.experiment import two_proportion_ztest, welch_ttest, required_sample_size

print("=" * 70)
print("DEMO 1: Conversion rate experiment (e.g. checkout button color test)")
print("=" * 70)

data = simulate_conversion_experiment(
    control_rate=0.10, treatment_rate=0.115, n_per_group=5000, seed=42
)
result = two_proportion_ztest(**data, metric_name="checkout_conversion")
print(result.summary())
print(f"95% CI on absolute lift: {result.confidence_interval}\n")

print("=" * 70)
print("DEMO 2: Continuous metric experiment (e.g. revenue per user)")
print("=" * 70)

data = simulate_continuous_experiment(
    control_mean=25.0, treatment_mean=27.5, std_dev=8.0, n_per_group=500, seed=7
)
result = welch_ttest(**data, metric_name="revenue_per_user")
print(result.summary())
print(f"95% CI on absolute lift: {result.confidence_interval}\n")

print("=" * 70)
print("DEMO 3: How big a sample do I need before running an experiment?")
print("=" * 70)

n = required_sample_size(baseline_rate=0.10, minimum_detectable_effect=0.10)
print(f"To detect a 10% relative lift on a 10% baseline conversion rate,")
print(f"you need at least {n:,} users per group (alpha=0.05, power=0.80).")
