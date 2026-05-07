.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview clean

help:
	@printf "%s\n" "Targets: install-hooks dev build test test-integration smoke lint fmt pages-preview clean"

install-hooks:
	@git config core.hooksPath .githooks
	@printf "%s\n" "Git hooks installed from .githooks"

dev:
	@npm run dev

build:
	@npm run build

test:
	@npm test

test-integration:
	@npm run test:integration

smoke:
	@./scripts/smoke.sh

lint:
	@npm run lint

fmt:
	@npm run fmt

pages-preview:
	@npm run pages-preview

clean:
	@rm -rf node_modules dist coverage tmp
