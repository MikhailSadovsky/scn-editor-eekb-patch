#!/bin/bash

cp src/* ../web-scn-editor/net.ostis.web.scn.client/src/scs-component/src/
cp grunt_tasks.js ../web-scn-editor/

cd ../web-scn-editor
grunt build
grunt exec:renewComponentsHtml
