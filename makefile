VIEWS_TO_COMPILE = login/reset
compile:
	node node_modules/bicycle/bin/bicycle.js compile -d public/views -t public/views/template.html -v /public/views/ -b /public/data/ ${VIEWS_TO_COMPILE}
