from pathlib import Path

import pytest

from app.db.seed_loader import parse_and_validate_seed_yaml


def test_parse_seed_yaml_valid():
    seed_path = (Path(__file__).resolve().parents[3] / "seed" / "schemes.yaml").resolve()
    assert seed_path.exists(), f"Seed file must exist at {seed_path}"

    schemes = parse_and_validate_seed_yaml(seed_path)
    assert len(schemes) >= 5

    # Check PM-Kisan
    pm_kisan = next((s for s in schemes if s["slug"] == "pm-kisan"), None)
    assert pm_kisan is not None
    assert pm_kisan["source"]["verification_status"] == "VERIFIED"
    assert len(pm_kisan["criteria"]) >= 2

    # Check unverified fixture handling
    draft = next((s for s in schemes if s["slug"] == "example-draft-scheme"), None)
    assert draft is not None
    assert draft["source"]["verification_status"] == "UNVERIFIED_EXAMPLE"


def test_parse_seed_yaml_missing_file():
    with pytest.raises(FileNotFoundError):
        parse_and_validate_seed_yaml(Path("non_existent_file.yaml"))
