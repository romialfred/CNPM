#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
SPECS = [
    ("OpenAPI canonique", ROOT / "docs/04-api/openapi.yaml", 79),
    ("Addendum vitrine R4", ROOT / "docs/12-member-showcase/api-addendum.yaml", 11),
]
HTTP_METHODS = {"get", "post", "put", "patch", "delete", "options", "head"}


def validate_spec(label: str, path: Path, expected_operations: int) -> int:
    document: dict[str, Any] = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert document.get("openapi") == "3.1.0", f"{label}: OpenAPI 3.1.0 attendu"
    assert isinstance(document.get("info"), dict), f"{label}: bloc info absent"
    assert isinstance(document.get("paths"), dict), f"{label}: bloc paths absent"

    operation_ids: list[str] = []
    for route, path_item in document["paths"].items():
        assert route.startswith("/"), f"{label}: route invalide {route}"
        assert isinstance(path_item, dict), f"{label}: path item invalide {route}"
        route_params = set()
        for name in route.split("{")[1:]:
            route_params.add(name.split("}", 1)[0])

        for method, operation in path_item.items():
            if method.lower() not in HTTP_METHODS:
                continue
            assert isinstance(operation, dict), f"{label}: opération invalide {method} {route}"
            operation_id = operation.get("operationId")
            assert isinstance(operation_id, str) and operation_id.strip(), (
                f"{label}: operationId absent pour {method.upper()} {route}"
            )
            operation_ids.append(operation_id)
            assert isinstance(operation.get("responses"), dict) and operation["responses"], (
                f"{label}: responses absent pour {operation_id}"
            )

            declared_path_params = {
                parameter.get("name")
                for parameter in operation.get("parameters", [])
                if isinstance(parameter, dict)
                and parameter.get("in") == "path"
                and parameter.get("required") is True
            }
            # Les paramètres peuvent être des références locales ; ils sont alors vérifiés
            # par la présence du nom dans components/parameters.
            referenced_params = {
                parameter.get("$ref", "").rsplit("/", 1)[-1]
                for parameter in operation.get("parameters", [])
                if isinstance(parameter, dict) and "$ref" in parameter
            }
            component_params = document.get("components", {}).get("parameters", {})
            referenced_path_param_names = {
                component_params[name].get("name")
                for name in referenced_params
                if name in component_params
                and isinstance(component_params[name], dict)
                and component_params[name].get("in") == "path"
                and component_params[name].get("required") is True
            }
            missing = route_params - declared_path_params - referenced_path_param_names
            assert not missing, f"{label}: paramètres de chemin non déclarés {missing} pour {operation_id}"

    assert len(operation_ids) == len(set(operation_ids)), f"{label}: operationId dupliqué"
    assert len(operation_ids) == expected_operations, (
        f"{label}: {len(operation_ids)} opérations, attendu {expected_operations}"
    )
    print(f"{label} OK: {len(operation_ids)} opérations")
    return len(operation_ids)


def main() -> None:
    total = 0
    for label, path, expected in SPECS:
        total += validate_spec(label, path, expected)
    print(f"Contrats OpenAPI OK: {total} opérations documentées")


if __name__ == "__main__":
    main()
