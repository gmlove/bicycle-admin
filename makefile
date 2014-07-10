VIEWS_TO_COMPILE = login

SHELL = /bin/bash

ALL_VIEWS = ${shell find public/pages/ -name '*.dust' | sed 's/public\/pages\/\/\(.*\)\.dust/\1/g' | tr '\n' ' '}

compile-all:
	node node_modules/bicycle/bin/bicycle.js compile -d public/pages -t public/pages/template.html -v /public/pages/ -b /webapi/pagesupport/ ${ALL_VIEWS}


compile:
	node node_modules/bicycle/bin/bicycle.js compile -d public/pages -t public/pages/template.html -v /public/pages/ -b /webapi/pagesupport/ login


compile-design:
	node node_modules/bicycle/bin/bicycle.js compile -d public/views -t public/views/template.html -v /public/views/ -b /public/data/ ${VIEWS_TO_COMPILE}
