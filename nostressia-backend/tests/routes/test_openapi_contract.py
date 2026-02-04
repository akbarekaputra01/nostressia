import json
from pathlib import Path

from app.main import create_app


def _load_openapi_spec() -> dict:
    repo_root = Path(__file__).resolve().parents[2]
    spec_path = repo_root / "docs" / "openapi.json"
    return json.loads(spec_path.read_text(encoding="utf-8"))


def _extract_path_methods(paths: dict) -> set[tuple[str, str]]:
    allowed_methods = {"get", "post", "put", "patch", "delete", "options", "head"}
    endpoints: set[tuple[str, str]] = set()
    for path, methods in paths.items():
        for method in methods.keys():
            if method.lower() in allowed_methods:
                endpoints.add((path, method.upper()))
    return endpoints


def test_openapi_contract_routes_are_registered():
    spec = _load_openapi_spec()
    expected = _extract_path_methods(spec["paths"])

    app = create_app()
    app_schema = app.openapi()
    actual = _extract_path_methods(app_schema["paths"])

    missing = expected - actual
    assert not missing, f"OpenAPI endpoints missing in app: {sorted(missing)}"
