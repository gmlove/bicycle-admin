bicycle-admin
=============

An app of bicycle framework. Targeting to easier create admin website.

Create a demo project
=======================

```
npm install -g git://github.com/gmlove/bicycle.git
npm install -g git://github.com/gmlove/bicycle-admin.git
bicycleAdmin createapp -n bicycle-demo -p ./
cd bicycle-demo
npm install
bower install
make update-pages
make compile-all
node node_modules/bicycle-admin/cli/bicycleAdmin.js initdb
node node_modules/bicycle-admin/cli/bicycleAdmin.js createsuperuser -u root -p 123456 -e xxx@gmail.com
node app
```

demo will start at [localhost:3000](http://localhost:3000).


Demo at heroku
=========================

I've alreay created a demo running in heroku.
You can view the demo [here](https://bicycle-demo.herokuapp.com/public/pages/login.html). (username: root, password: 123456)



