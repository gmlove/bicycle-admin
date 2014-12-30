### step to run

```

npm install
bower install
make update-pages
node node_modules/bicycle-admin/cli/bicycleAdmin.js initdb
node node_modules/bicycle-admin/cli/bicycleAdmin.js createsuperuser -u root -p 123456 -e xxx@gmail.com
make compile-all

node app

```
