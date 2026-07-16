.PHONY: validate validate-api validate-ui toolchain infra-config infra-up infra-down

validate:
	bash scripts/validate-pack.sh

validate-api:
	bash scripts/validate-openapi.sh

validate-ui:
	cd docs/ui-handoff && bash scripts/validate.sh

toolchain:
	bash scripts/check-toolchain.sh

infra-config:
	docker compose --env-file .env -f infrastructure/docker/compose.yaml config

infra-up:
	docker compose --env-file .env -f infrastructure/docker/compose.yaml up -d

infra-down:
	docker compose --env-file .env -f infrastructure/docker/compose.yaml down
