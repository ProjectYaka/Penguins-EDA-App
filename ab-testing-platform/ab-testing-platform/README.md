# A/B Testing & Experimentation Platform

A lightweight statistical engine + REST API for analyzing product experiments (A/B tests). Built to demonstrate applied statistics, data science, and software engineering practices together — not just a Jupyter notebook, but a tested, documented, CI-integrated package.

## Why this project exists

Most student data science projects stop at "trained a model in a notebook." This project instead answers a real product question — *"is this change actually better, or is that just noise?"* — using the statistical machinery companies actually rely on (two-proportion z-tests, Welch's t-test, power analysis, sequential testing), and wraps it in software that could plausibly sit behind a real internal tool.

## Features

- **Two-proportion z-test** — for conversion-rate style metrics (signup rate, click-through rate, etc.)
- **Welch's t-test** — for continuous metrics (revenue per user, session length) without assuming equal variances
- **Minimum sample size / power calculation** — answers "how long do I need to run this experiment?" *before* you run it
- **Sequential testing boundaries** — a simple alpha-spending approach to reduce false positives from "peeking" at results early
- **REST API (FastAPI)** — analyze experiments over HTTP, with interactive Swagger docs
- **Data simulation module** — generate synthetic experiments with known ground truth, useful for testing and demos
- **Unit tests + GitHub Actions CI** — every push is automatically tested

## Project structure

```
ab-testing-platform/
├── src/
│   ├── experiment.py    # statistical tests, power analysis
│   ├── simulate.py      # synthetic data generation
│   └── api.py           # FastAPI endpoints
├── tests/
│   └── test_experiment.py
├── .github/workflows/ci.yml
├── demo.py               # end-to-end usage example
├── requirements.txt
└── README.md
```

## Quickstart

```bash
# 1. Clone and enter the repo
git clone https://github.com/YOUR_USERNAME/ab-testing-platform.git
cd ab-testing-platform

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the demo (simulates + analyzes two experiments)
python demo.py

# 4. Run the test suite
pytest tests/ -v

# 5. (Optional) Start the API
uvicorn src.api:app --reload
# then open http://127.0.0.1:8000/docs
```

## Example output

```
[checkout_conversion] control=0.0986 treatment=0.1118 lift=13.39% p=0.0315 (SIGNIFICANT, alpha=0.05) via two-proportion z-test
95% CI on absolute lift: (0.0012, 0.0252)
```

## Example API usage

```bash
curl -X POST http://127.0.0.1:8000/test/conversion \
  -H "Content-Type: application/json" \
  -d '{
    "control_successes": 100,
    "control_n": 1000,
    "treatment_successes": 130,
    "treatment_n": 1000
  }'
```

## Statistical notes

- The two-proportion z-test uses a **pooled variance** estimate under the null hypothesis, standard practice for A/B conversion testing.
- Welch's t-test is used instead of Student's t-test because it does not assume equal variances between groups — a safer default in practice.
- Sample size calculations assume a two-sided test at the specified alpha and power.
- The sequential testing boundary is a simplified O'Brien-Fleming-style approximation, meant to illustrate the concept of alpha-spending rather than serve as a production-grade sequential testing library.

## Possible extensions

- Bayesian A/B testing (beta-binomial posterior, probability-to-be-best)
- Multi-armed bandit allocation
- Streamlit dashboard for non-technical stakeholders
- Persisting experiment results to a database

## Author

Michael Mayaka — B.S. Data Science, Minor in Statistics & Software Systems, UNC Charlotte
