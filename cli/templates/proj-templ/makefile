VIEWS_TO_COMPILE = login

SHELL = /bin/bash

ALL_VIEWS = ${shell find public/pages/ -name '*.dust' | sed 's/public\/pages\/\/*\(.*\)\.dust/\1/g' | tr '\n' ' '}

compile-all:
	node node_modules/bicycle/bin/bicycle.js compile -d public/pages -t public/pages/template.html -v /public/pages/ -b /webapi/pagesupport/ ${ALL_VIEWS}


compile:
	node node_modules/bicycle/bin/bicycle.js compile -d public/pages -t public/pages/template.html -v /public/pages/ -b /webapi/pagesupport/ login


compile-design:
	node node_modules/bicycle/bin/bicycle.js compile -d public/views -t public/views/template.html -v /public/views/ -b /public/data/ ${VIEWS_TO_COMPILE}


update-pages:
	-mkdir -p public/pages/
	-mkdir -p public/js/
	-mkdir -p public/css/
	-mkdir -p public/vendor/
	-mkdir -p public/fonts/
	-mkdir -p public/img/
	cp -rfv node_modules/bicycle-admin/public/pages/* public/pages/
	cp -rfv node_modules/bicycle-admin/public/css/* public/css/
	cp -rfv node_modules/bicycle-admin/public/js/* public/js/
	cp -rfv node_modules/bicycle-admin/public/img/* public/img/
	cp -rfv node_modules/bicycle-admin/public/fonts/* public/fonts/
	cp -rfv node_modules/bicycle-admin/public/vendor/* public/vendor/

