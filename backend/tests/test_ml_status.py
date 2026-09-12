import pytest
from fastapi.testclient import TestClient
from backend.api.server import app


client = TestClient(app)


def test_ml_status_endpoints():
    r_status = client.get("/api/ml/status")
    assert r_status.status_code == 200
    data = r_status.json()
    assert data["offline"] is True
    assert data["evidence_model"]["available"] is True
    assert data["ranking_model"]["available"] is True

    r_ev = client.get("/api/ml/evidence/status")
    assert r_ev.status_code == 200
    assert r_ev.json()["model_version"] == "evidence-v1"

    r_rk = client.get("/api/ml/ranking/status")
    assert r_rk.status_code == 200
    assert len(r_rk.json()["features"]) == 15

    r_eval = client.get("/api/ml/evaluation")
    assert r_eval.status_code == 200
    assert "validated_metrics" in r_eval.json()
    assert "ranking_diagnostics" in r_eval.json()
