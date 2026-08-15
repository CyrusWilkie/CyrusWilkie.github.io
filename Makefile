# Local development and production build.
# Pagefind is fetched via npx on first run; no package.json needed.

.PHONY: dev build clean docker

dev:
	hugo server -D

build:
	hugo --minify
	npx -y pagefind --site public

clean:
	rm -rf public resources/_gen .hugo_build.lock

docker:
	docker compose up -d --build
