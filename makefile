VIEWS_TO_COMPILE = login/reset
compile:
	node node_modules/bicycle/bin/bicycle.js compile -d public/views -t public/views/template.html -v /views/ -b /webapi/ ${VIEWS_TO_COMPILE}
