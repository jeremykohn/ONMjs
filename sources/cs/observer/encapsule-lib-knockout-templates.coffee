###

  http://schema.encapsule.org/schema.html

  A single-page HTML5 application for creating, visualizing, and editing
  JSON-encoded Soft Circuit Description Language (SCDL) models.

  Copyright 2013 Encapsule Project, Copyright 2013 Chris Russell

  Distributed under the terms of the Boost Software License Version 1.0
  See included license.txt or http://www.boost.org/LICENSE_1_0.txt

  Sources on GitHub: https://github.com/Encapsule-Project/schema

  Visit http://www.encapsule.org for more information and happy hacking.

###
#
# encapsule-lib-ko-helpers.coffee
#

namespaceEncapsule = Encapsule? and Encapsule or @Encapsule = {}
Encapsule.code = Encapsule.code? and Encapsule.code or @Encapsule.code = {}
Encapsule.code.lib = Encapsule.code.lib? and Encapsule.code.lib or @Encapsule.code.lib = {}
Encapsule.code.lib.kohelpers = Encapsule.code.lib.kohelpers? and Encapsule.code.lib.kohelpers or @Encapsule.code.lib.kohelpers = {}

Encapsule.runtime = Encapsule.runtime? and Encapsule.runtime or @Encapsule.runtime = {}
Encapsule.runtime.app = Encapsule.runtime.app? and Encapsule.runtime.app or @Encapsule.runtime.app = {}
Encapsule.runtime.app.kotemplates = Encapsule.runtime.app.kotemplates? and Encapsule.runtime.app.kotemplates or @Encapsule.runtime.app.kotemplates = []


# ============================================================================
Encapsule.code.lib.kohelpers.RegisterKnockoutViewTemplate = (selectorId_, fnHtml_) ->
    try
        if not selectorId_? or not selectorId_ or not fnHtml_? or not fnHtml_ then throw "RegisterKnockoutViewTemplate bad parameter(s)"
        koTemplate = { selectorId_ , fnHtml_ }
        Encapsule.runtime.app.kotemplates.push koTemplate
        true
    catch exception
        throw "RegisterKnockoutViewTemplate selectorId=#{selectorId_} : #{exception}"


# ============================================================================
Encapsule.code.lib.kohelpers.InstallKnockoutViewTemplate = (descriptor_, templateCacheEl_) ->
    try
        if not templateCacheEl_? or not templateCacheEl_ then throw "Invalid templateCache element parameter."
        if not descriptor_? or not descriptor_ then throw "Invalid descriptor parameter."
        if not descriptor_.selectorId_? or not descriptor_.selectorId_ then throw "Invalid descriptor.selectorId_ parameter."
        if not descriptor_.fnHtml_? or not descriptor_.fnHtml_ then throw "Invalid descriptor.fnHtml_ parameter."
        selector = "##{descriptor_.selectorId_}"
        koTemplateJN = $(selector);
        if koTemplateJN.length == 1 then throw "Duplicate Knockout.js HTML view template registration. id=\"#{descriptor_.selectorId_}\""
        htmlViewTemplate = undefined
        try
            htmlViewTemplate = descriptor_.fnHtml_()
        catch exception
            throw "While evaluating the #{descriptor_.selectorId_} HTML callback: #{exception}"
        templateCacheEl_.append($("""<script type="text/html" id="#{descriptor_.selectorId_}">#{htmlViewTemplate}</script>"""))
        return true
    catch exception
        throw "Encapsule.code.lib.kohelpers.InstallKnockoutViewTemplate for descriptor #{descriptor_.selectorId_} : #{exception}"


# ============================================================================
# templateCacheSelector_ is a JQuery selector string. e.g.
# <div id="idKnockoutTemplates"></div>
# InstallKnockoutViewTemplates("#idKnockoutTemplates");

Encapsule.code.lib.kohelpers.InstallKnockoutViewTemplates = (templateCacheSelector_) ->
    try
        if not (templateCacheSelector_? and templateCacheSelector_)
             throw "You must specify the selector string of the Knockout.js view model template cache's DOM element."

        templateCacheEl = $(templateCacheSelector_)

        # Insert the HTML templates into the DOM
        for descriptor in Encapsule.runtime.app.kotemplates
            Encapsule.code.lib.kohelpers.InstallKnockoutViewTemplate(descriptor, templateCacheEl)

        Encapsule.runtime.app.kotemplates = []
        true

    catch exception
         throw """InstallKnockoutViewTemplates failure: #{exception}"""

