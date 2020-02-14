module.exports = function () {
    var buildDest = require('./build_config.js')('scn-editor-build-dest');
    var scsCompDest = require('./build_config.js')('scs-cmp-build-dest');
    var scsCssDest = require('./build_config.js')('scs-css-build-dest');
    var componentsFile = require('./build_config.js')('components-def-file');
    var componentsFolder = require('./build_config.js')('components-def-folder');
    var imsScriptsFolder = require('./build_config.js')('ims-scripts-folder');
    return {
        concat: {
            editor: {
                src: 'net.ostis.web.scn.client/src/editor/src/Ostis/scneditor/*.js',
                dest: buildDest + 'scn_editor.js'
            },
            editorcss: {
                src: 'net.ostis.web.scn.client/src/editor/css/*.css',
                dest: buildDest + 'scn_editor.css'
            },
            scscmp: {
                src: [
                    'net.ostis.web.scn.client/src/scs-component/src/scs.js',
                    'net.ostis.web.scn.client/src/scs-component/src/scs-viewer.js',
                    'net.ostis.web.scn.client/src/scs-component/src/scs-output.js',
                    'net.ostis.web.scn.client/src/scs-component/src/scs-types.js',
                    'net.ostis.web.scn.client/src/scs-component/src/scn-output.js',
                    'net.ostis.web.scn.client/src/scs-component/src/scn-tree.js',
                    'net.ostis.web.scn.client/src/scs-component/src/scn-highlighter.js',
                    'net.ostis.web.scn.client/src/scs-component/src/scs-component.js',
                    'net.ostis.web.scn.client/src/scs-component/src/scs-expert-mode.js',
                    'net.ostis.web.scn.client/src/scs-component/src/removeSystemTriples.js'],
                dest: scsCompDest + 'scs.js'
            },
            scscss: {
                src: 'net.ostis.web.scn.client/src/scs-component/css/*.css',
                dest: scsCssDest + 'scs.css'
            }
        },
        copy: {
            templates: {
                cwd: 'net.ostis.web.scn.client/src/editor/handlebars_templates/',
                src: '**',
                dest: buildDest + '/handlebars_templates/',
                expand: true,
                flatten: true
            },
            image: {
                cwd: 'net.ostis.web.scn.client/src/editor/images/',
                src: '**',
                dest: buildDest + 'editor_images/',
                expand: true,
                flatten: true
            },
            vendor: {
                cwd: 'net.ostis.web.scn.client/src/editor/vendor/',
                src: '**',
                dest: buildDest,
                expand: true,
                flatten: true
            },
            kbFiles: {
                cwd: 'kb.files/',
                src: '**',
                dest: buildDest + '../../../../../../ims.ostis.kb/ui/',
                expand: true,
                flatten: true
            }
        },
        watch: {
            editorcss: {
                files: 'net.ostis.web.scn.client/src/editor/css/*.css',
                tasks: ['concat:editorcss']
            },
            editor: {
                files: 'net.ostis.web.scn.client/src/editor/src/Ostis/scneditor/*.js',
                tasks: ['concat:editor']
            },
            scscss: {
                files: 'net.ostis.web.scn.client/src/scs-component/css/*.css',
                tasks: ['concat:scscss']
            },
            scscmp: {
                files: 'net.ostis.web.scn.client/src/scs-component/src/*.js',
                tasks: ['concat:scscmp']
            },
            templates: {
                files: 'net.ostis.web.scn.client/src/editor/handlebars_templates/**',
                tasks: ['copy:templates']
            }
        },
        exec: {
            renewComponentsHtml: 'sh revert-components.sh ' + componentsFile,
            startSctp: "xterm -hold -e '" + "cd " + imsScriptsFolder + " && sh run_sctp.sh'",
            startScweb: "xterm -hold -e '" + "cd " + imsScriptsFolder + " && sh run_scweb.sh'",
            startWatch: "xterm -hold -e 'grunt watch'"
        },
        concurrent: {
            startScripts: ['exec:startSctp', 'exec:startScweb', 'exec:startWatch']
        }
    }
};

