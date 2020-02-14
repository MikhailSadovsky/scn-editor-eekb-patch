SCsComponent = {
    ext_lang: 'scs_code',
    formats: ['format_scs_json'],
    factory: function (sandbox) {

        return new SCsViewer(sandbox);
    },
    getRequestKeynodes: function () {

        var keynodes = ['nrel_section_base_order', 'rrel_key_sc_element', 'nrel_key_sc_element_base_order'];
        return keynodes.concat(SCs.SCnSortOrder);
    }
};

var SCsViewer = function (sandbox) {

    this.objects = new Array();
    this.addrs = new Array();
    this.sc_links = {}; // map of sc-link objects key:addr, value: object
    this.data = null;

    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;
    this.expertModeModeManager = new ExpertModeManager(sandbox);

    SCWeb.core.EventManager.subscribe("expert_mode_changed", this, () => {
        //this.sandbox.removeChild();
        //this.viewer = new SCs.Viewer();
        this.viewer.buildOutput();
        this.sandbox.eventDataAppend(this.data, true);
        this.sandbox.translate();
    });

    // ---- window interface -----
    var viewerReceiveData = jQuery.proxy(function (data, overwrite) {

        this.data = data;
        data = this.expertModeModeManager.applyExpertMode(data);
        this.viewer.appendData(data, overwrite);

        var dfd = new jQuery.Deferred();

        $.when(this.sandbox.createViewersForScLinks(this.viewer.getLinks())).then(function () {

            dfd.resolve();
        }, function () {

            dfd.reject();
        });
        return dfd.promise();
    }, this);
    var root = {};
    this.root = root;
    var editorReceiveData = jQuery.proxy(function (data) {

        if (console) {
            console.log("editor try receive data")
        }

        if (typeof data == 'string') {
            data = JSON.parse(data);
        }

        var dataTree = new SCs.SCnTree();
        dataTree.init(null, $.proxy(sandbox.getKeynode, sandbox));
        dataTree.build(data.keywords, data.triples);
        root.dataTree = dataTree;
        Ostis.scneditor.KeynodesHandler.addContentAddrs(dataTree.addrs);
        if (root.namesMap !== undefined) {
            var editorJson = treeToJson(dataTree, root.namesMap);
            Ostis.scneditor.addCommand(new Ostis.scneditor.ConvertFromJSONCommand(Ostis.scneditor.SCnArticle.getInstance(), editorJson));
        }

    }, this);

    var viewUpdateTranslation = jQuery.proxy(function (namesMap) {

        root.namesMap = namesMap;
        $(this.sandbox.container_selector).each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (!$(element).hasClass('sc-content') && !$(element).hasClass('sc-contour') && !$(element).hasClass('scs-scn-connector')) {
                $(element).removeClass('resolve-idtf-anim');
                if (namesMap[addr]) {
                    $(element).text(namesMap[addr]);
                } else {
                    $(element).html('<b>...</b>');
                }
            }
        });
    }, this);

    var editUpdateTranslation = jQuery.proxy(function (namesMap) {

        if (root.dataTree !== undefined) {
            // in case existing article is opened
            var editorJson = treeToJson(root.dataTree, namesMap);
            Ostis.scneditor.addCommand(new Ostis.scneditor.ConvertFromJSONCommand(Ostis.scneditor.SCnArticle.getInstance(), editorJson));
        }
        $(this.sandbox.container_selector).each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (!$(element).hasClass('sc-content') && !$(element).hasClass('sc-contour') && !$(element).hasClass('scs-scn-connector')) {
                $(element).removeClass('resolve-idtf-anim');
                if (namesMap[addr]) {
                    $(element).text(namesMap[addr]);
                } else {
                    $(element).html('<b>...</b>');
                }
            }
        });
    }, this);

    var viewObjectsToTranslate = function () {

        return this.viewer.getAddrs();
    };

    var editObjectsToTranslate = function () {

        return Ostis.scneditor.KeynodesHandler.uiElemAddreses;
    };

    this.sandbox.eventDataAppend = viewerReceiveData;
    this.sandbox.eventGetObjectsToTranslate = jQuery.proxy(viewObjectsToTranslate, this);
    this.sandbox.eventApplyTranslation = viewUpdateTranslation;

    var articleContainer = sandbox.container + "-article";
    var editBtnId = sandbox.container + "-edit-article-btn";
    var newArticleId = sandbox.container + "-new-article-btn";
    var saveChangesBtnId = sandbox.container + "-save-article-btn";
    var cancelChangesBtnId = sandbox.container + "-cancel-article-btn";
    var toolbar = sandbox.container + "-toolbar-article-btn";
    var $editBtnId = '#' + editBtnId;
    var $articleContainerId = '#' + articleContainer;
    var $saveChangesBtnId = '#' + saveChangesBtnId;
    var $newArticleId = '#' + newArticleId;
    var $cancelChangesBtnId = '#' + cancelChangesBtnId;
    var $toolbar = '#' + toolbar;
    var cmpMarkup = "<div class=\"btn-group\">"
        + "<button id=\""
        + newArticleId
        + "\" type=\"button\" class=\"btn btn-success\" data-container=\"body\" data-toggle=\"popover\" data-placement=\"right\">"
        + "<span class=\"glyphicon glyphicon-file\"></span></button>"
        + "<button id=\""
        + editBtnId
        + "\" type=\"button\" class=\"btn btn-success\" data-container=\"body\" data-toggle=\"popover\" data-placement=\"right\">"
        + "<span class=\"glyphicon glyphicon-edit\"></span></button></div>"
        + "<div id=\"toolbarMenu\" class=\"btn-group\" style=\"\">"
        + "<button id=\""
        + toolbar
        + "\" type=\"button\" style=\"display:none\" class=\"btn btn-success bootlbG\" data-container=\"body\" data-toggle=\"popover\" data-placement=\"right\">"
        + "<span class=\"glyphicon glyphicon-th-list\"></span></button>"
        + "<button id=\""
        + saveChangesBtnId
        + "\" type=\"button\" style=\"display:none\" class=\"btn btn-success\" data-container=\"body\" data-toggle=\"popover\" data-placement=\"right\">"
        + "<span class=\"glyphicon glyphicon-ok\"></span></button>"
        + "<button id=\""
        + cancelChangesBtnId
        + "\" type=\"button\" style=\"display:none\" class=\"btn btn-success\"  data-container=\"body\" data-toggle=\"popover\" data-placement=\"right\">"
        + "<span class=\"glyphicon glyphicon-remove\"></span></button></div>"
        + "<div id=\"" + articleContainer + "\"></div>";
    jQuery(this.container).append(cmpMarkup);

    var updateContent = jQuery.proxy(function () {
        var self = this;
        SCWeb.core.Main.getTranslatedAnswer(this.sandbox.command_state)
            .then(function (answer_addr) {
                sandbox.addr = answer_addr;
                sandbox.eventStructUpdate = true;
                self.viewer = new SCs.Viewer();
                sandbox.removeChild();
                self.viewer.init(sandbox, articleContainer, jQuery.proxy(sandbox.getKeynode, sandbox), sandbox.generateWindowContainer);
                self.sandbox.eventGetObjectsToTranslate = jQuery.proxy(viewObjectsToTranslate, self);
                self.sandbox.eventApplyTranslation = viewUpdateTranslation;
                self.sandbox.eventDataAppend = viewerReceiveData;
                self.sandbox.updateContent();
            });
    }, this);

    jQuery($newArticleId).on('click', jQuery.proxy(function () {

        //clear existing data in the root object
        root.dataTree = undefined;
        jQuery($("#static-window-container")).hide();
        jQuery($("#window-container")).removeClass("col-xs-10 col-sm-10 col-md-10");
        //jQuery($("#window-container")).css("height", "initial");
        jQuery($toolbar).show();

        jQuery($editBtnId).hide();
        jQuery($newArticleId).hide();
        jQuery($saveChangesBtnId).show();
        jQuery($cancelChangesBtnId).show();
        jQuery($articleContainerId).empty();
        this.sandbox.eventGetObjectsToTranslate = jQuery.proxy(editObjectsToTranslate, this);
        this.sandbox.eventApplyTranslation = editUpdateTranslation;
        this.sandbox.eventDataAppend = jQuery.proxy(function (data) {
        }, this);
        Ostis.scneditor.WorkbenchActivator.start(articleContainer, sandbox).done(function () {

            sandbox.updateContent();
        });
    }, this));
    jQuery($editBtnId).on('click', jQuery.proxy(function () {

        jQuery($("#static-window-container")).hide();
        jQuery($("#window-container")).removeClass("col-xs-10 col-sm-10 col-md-10");
        //jQuery($("#window-container")).css("height", "initial");
        jQuery($toolbar).show();

        jQuery($editBtnId).hide();
        jQuery($newArticleId).hide();
        jQuery($saveChangesBtnId).show();
        jQuery($cancelChangesBtnId).show();
        jQuery($articleContainerId).empty();
        this.sandbox.eventGetObjectsToTranslate = jQuery.proxy(editObjectsToTranslate, this);
        this.sandbox.eventApplyTranslation = editUpdateTranslation;
        this.sandbox.eventDataAppend = editorReceiveData;
        Ostis.scneditor.WorkbenchActivator.start(articleContainer, sandbox).done(function () {

            sandbox.updateContent();
        });
    }, this));
    jQuery($saveChangesBtnId).on('click', jQuery.proxy(function () {

        jQuery($("#static-window-container")).show();
        jQuery($("#window-container")).addClass("col-xs-10 col-sm-10 col-md-10");
        //jQuery($("#window-container")).css("height", "inherit");
        jQuery($toolbar).hide();

        jQuery($saveChangesBtnId).hide();
        jQuery($cancelChangesBtnId).hide();
        jQuery($editBtnId).show();
        jQuery($newArticleId).show();
        Ostis.scneditor.SCnEditor.getDao().saveArticle(Ostis.scneditor.SCnArticle.getInstance().toJSON());
        Ostis.scneditor.WorkbenchActivator.destroy();
        this.viewer = new SCs.Viewer();
        this.sandbox.eventApplyTranslation = viewUpdateTranslation;
        SCWeb.core.Server.doCommand(SCWeb.core.Main.default_cmd, this.sandbox.cmd_args, function (result) {
            sandbox.addr = result.addr;
        });
    }, this));
    jQuery($cancelChangesBtnId).on('click', jQuery.proxy(function () {

        //TODO IZh: show prompt pop-up window in case some changes exist

        jQuery($("#static-window-container")).show();
        jQuery($("#window-container")).addClass("col-xs-10 col-sm-10 col-md-10");
        //jQuery($("#window-container")).css("height", "inherit");
        jQuery($toolbar).hide();

        jQuery($saveChangesBtnId).hide();
        jQuery($cancelChangesBtnId).hide();
        jQuery($editBtnId).show();
        jQuery($newArticleId).show();
        Ostis.scneditor.WorkbenchActivator.destroy();
        updateContent();
    }, this));

    this.viewer = new SCs.Viewer();
    this.viewer.init(sandbox, articleContainer, jQuery.proxy(sandbox.getKeynode, sandbox), sandbox.generateWindowContainer);

    this.sandbox.updateContent();
};

var SCsConnectors = {};

$(document).ready(function () {

    SCsConnectors[sc_type_arc_pos_const_perm] = "->";
    SCsConnectors[sc_type_edge_common | sc_type_const] = "==";
    SCsConnectors[sc_type_edge_common | sc_type_var] = "_==";
    SCsConnectors[sc_type_arc_common | sc_type_const] = "=>";
    SCsConnectors[sc_type_arc_common | sc_type_var] = "_=>";
    SCsConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm] = "_->";
});

function treeToJson(dataTree, namesMap) {

    var node = dataTree.nodes[0];
    var nodeJson = {};
    nodeJson.contour = true;
    nodeJson.SCArcs = [];
    nodeJson.SCSynonims = [];
    nodeJson.label = namesMap[node.element.addr];
    nodeJson.scaddr = node.element.addr;
    var articleJson = nodeToJson(node, namesMap);
    nodeJson.SCNodes = [articleJson];
    articleJson.SCSynonims = [];
    var contourTree = dataTree.subtrees[node.element.addr];
    if (contourTree) {
        articleJson.SCSynonims.push(treeToJson(contourTree, namesMap));
    }
    return nodeJson;
}

function nodeToJson(node, namesMap) {

    var nodeJson = {};
    nodeJson.label = namesMap[node.element.addr];
    nodeJson.scaddr = node.element.addr;
    var arcs = [];
    for (var i = 0; i < node.childs.length; i++) {
        var child = node.childs[i];
        var arc = {};
        if (node.element.type === 161) {
            var elementOfSet = {};
            elementOfSet.element = child.element;
            elementOfSet.childs = child.childs.slice(1, child.childs.length);
            elementOfSet.triple = child.triple;
            arc = nodeToJson(elementOfSet, namesMap);
        } else {
            arc.type = getArcType(child.triple[1].type, child.backward);
            var attrs = [];
            for (var j = 0; j < child.attrs.length; j++) {
                var attr = {};
                attr.label = namesMap[child.attrs[j].n.addr];
                attr.scaddr = child.attrs[j].n.addr;
                attrs.push(attr);
            }
            arc.SCAttributes = attrs;
            arc.SCNode = nodeToJson(child, namesMap);
        }
        arcs.push(arc);
    }
    nodeJson.SCSynonims = [];
    if (node.element.type === 161) {
        nodeJson.set = true;
        nodeJson.SCNodes = arcs;
        nodeJson.SCArcs = [];
    } else if (node.element.type === 2) {
        nodeJson.file = true;
        nodeJson.fileName = node.element.addr;
        nodeJson.SCArcs = arcs;
    } else {
        nodeJson.SCArcs = arcs;
    }
    return nodeJson;
}

function getArcType(childType, backward) {

    var arc = SCs.SCnConnectors[childType];
    if (backward === true) {
        return arc.b;
    } else {
        return arc.f;
    }
}

SCWeb.core.ComponentManager.appendComponentInitialize(SCsComponent);