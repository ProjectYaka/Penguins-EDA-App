"""
REST API for running A/B test analysis.

Run locally with:
    uvicorn src.api:app --reload

Then visit http://127.0.0.1:8000/docs for interactive Swagger UI.
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field

from src.experiment import two_proportion_ztest, welch_ttest, required_sample_size

app = FastAPI(
    title="A/B Testing Platform API",
    description="Statistical significance testing for product experiments",
    version="1.0.0",
)


class ConversionTestRequest(BaseModel):
    control_successes: int = Field(..., ge=0)
    control_n: int = Field(..., gt=0)
    treatment_successes: int = Field(..., ge=0)
    treatment_n: int = Field(..., gt=0)
    alpha: float = 0.05
    metric_name: str = "conversion_rate"


class ContinuousTestRequest(BaseModel):
    control_values: list[float]
    treatment_values: list[float]
    alpha: float = 0.05
    metric_name: str = "continuous_metric"


class SampleSizeRequest(BaseModel):
    baseline_rate: float = Field(..., gt=0, lt=1)
    minimum_detectable_effect: float = Field(..., gt=0)
    alpha: float = 0.05
    power: float = 0.8


@app.get("/")
def root():
    return {"status": "ok", "service": "ab-testing-platform"}


@app.post("/test/conversion")
def test_conversion(req: ConversionTestRequest):
    result = two_proportion_ztest(
        req.control_successes,
        req.control_n,
        req.treatment_successes,
        req.treatment_n,
        alpha=req.alpha,
        metric_name=req.metric_name,
    )
    return result.__dict__


@app.post("/test/continuous")
def test_continuous(req: ContinuousTestRequest):
    result = welch_ttest(
        req.control_values,
        req.treatment_values,
        alpha=req.alpha,
        metric_name=req.metric_name,
    )
    return result.__dict__


@app.post("/sample-size")
def sample_size(req: SampleSizeRequest):
    n = required_sample_size(
        req.baseline_rate,
        req.minimum_detectable_effect,
        alpha=req.alpha,
        power=req.power,
    )
    return {"required_sample_size_per_group": n}
