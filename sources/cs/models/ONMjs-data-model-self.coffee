###
------------------------------------------------------------------------------

The MIT License (MIT)

Copyright (c) 2013 Encapsule Project
  
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**** Encapsule Project :: Build better software with circuit models ****

OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule

------------------------------------------------------------------------------



------------------------------------------------------------------------------

###
#
#
#

namespaceEncapsule = Encapsule? and Encapsule or @Encapsule = {}
Encapsule.code = Encapsule.code? and Encapsule.code or @Encapsule.code = {}
Encapsule.code.lib = Encapsule.code.lib? and Encapsule.code.lib or @Encapsule.code.lib = {}
Encapsule.code.lib.onm = Encapsule.code.lib.onm? and Encapsule.code.lib.onm or @Encapsule.code.lib.onm = {}

ONMjs = Encapsule.code.lib.onm
ONMjs.dataModels = ONMjs.dataModels? and ONMjs.dataModels or ONMjs.dataModels = {}

ONMjs.dataModels.implementation = ONMjs.dataModels.implementation? and ONMjs.dataModels.implementation or ONMjs.dataModels.implementation = {}

ONMjs.dataModels.implementation.selfDeclaration = {}

ONMjs.dataModels.implementation.selfDeclaration.namespaceMetaProperties =
    namespaceType: "extensionPoint"
    jsonTag: "metaProperties"
    ____label: "meta properties"
    ____descriptor: "Collection of this namespaces' meta-properties."
    componentArchetype:
        namespaceType: "component"
        jsonTag: "metaproperty"
        ____label: "meta property"
        ____description: "Meta property"
        ____getLabelVariant: "jsonTagAndValue"
        
        namespaceProperties:
            userImmutable:
                uuid:
                    ____type: "uuid"
                    fnCreate: -> uuid.v4()
            userMutable:
                jsonTag:
                    ____type: "JSON tag string"
                    fnCreate: -> ""
                value:
                    ____type: "string"
                    fnCreate: -> ""

ONMjs.dataModels.implementation.selfDeclaration.namespaceProperty =
    namespaceType: "component"
    jsonTag: "property"
    ____label: "property"
    ____description: "Namespace property."
    ____getLabelVariant: "jsonTagAndValue"
    namespaceProperties:
        userImmutable:
            uuid:
                ____type: "uuid"
                fnCreate: -> uuid.v4()
        userMutable:
            jsonTag:
                ____type: "JSON tag string"
                defaultValue: ""
            value:
                ____type: "string"
                defaultValue: ""
            ____type:
                ____type: "string"
                defaultValue: ""
            ____description:
                ____type: "string"
                defaultValue: ""
    subNamespaces: [
        ONMjs.dataModels.implementation.selfDeclaration.namespaceMetaProperties        
    ]

ONMjs.dataModels.implementation.selfDeclaration.namespaceProperties =
    namespaceType: "child"
    jsonTag: "properties"
    ____label: "properties"
    ____description: "Namespace properties."
    subNamespaces: [
        {
            namespaceType: "extensionPoint"
            jsonTag: "userImmutable"
            ____label: "immutable"
            ____description: "User immutable namespace properties."
            componentArchetype: ONMjs.dataModels.implementation.selfDeclaration.namespaceProperty 

        }

        {
            namespaceType: "extensionPoint"
            jsonTag: "userMutable"
            ____label: "mutable"
            ____description: "User mutable namespace properties."
            componentArchetype: ONMjs.dataModels.implementation.selfDeclaration.namespaceProperty 

        }


    ]

ONMjs.dataModels.implementation.selfDeclaration.semanticBindings =
    namespaceType: "child"
    jsonTag: "semanticBindings"
    ____label: "Semantic Bindings"
    ____description:" Semantic binding options for this data model."
    namespaceProperties:
        userMutable:
            componentKeyGenerator:
                defaultValue: "internal"
                ____type: "enum"
                ____values: [ "disabled", "internal", "external" ]
            componentKeyType:
                defaultValue: "locallyUnique"
                ____type: "enum"
                ____values: [ "locallyUnique", "globallyUnique" ]
            namespaceVersioning:
                defaultValue: "disabled"
                ____type: "enum"
                ____values: [ "disabled", "internal", "external" ]
            namespaceVersioningMode:
                defaultValue: "disabled"
                ____type: "enum"
                ____values: [ "disabled", "simple", "advanced" ]




ONMjs.dataModels.selfDeclaration = {
    namespaceType: "root"
    jsonTag: "littleDragon"
    ____label: "Little Dragon"
    ____description: "ONMjs data model declaration editor."

    subNamespaces: [   
        {
            namespaceType: "extensionPoint"
            jsonTag: "dragonEggs"
            ____label: "Dragon Eggs"
            ____description: "ONMjs data model declaration collection."
            componentArchetype: {
                namespaceType: "component"
                jsonTag: "dragonEgg"
                ____label: "Dragon Egg"
                ____description: "ONMjs data model declaration."
                ____getLabelVariant: "jsonTagAndNamespaceType"

                namespaceProperties: 
                    userImmutable:
                        revision:
                            ____type: "integer"
                            defaultValue: 0
                        uuid:
                            ____type: "uuid"
                            fnCreate: -> uuid.v4()
                        uuidRevision:
                            ____type: "uuid"
                            fnCreate: -> uuid.v4()
                        namespaceType:
                            ____type: "namespaceTypeEnum"
                            defaultValue: "root"
                    userMutable:
                        jsonTag:
                            ____type: "JSON tag string"
                            defaultValue: ""
                        ____label:
                            ____type: "String"
                            defaultValue: ""
                        ____description:
                            ____type: "String"
                            defaultValue: ""
                subNamespaces: [
                    ONMjs.dataModels.implementation.selfDeclaration.namespaceProperties 
                    ONMjs.dataModels.implementation.selfDeclaration.namespaceMetaProperties 
                    ONMjs.dataModels.implementation.selfDeclaration.semanticBindings
                    {
                        namespaceType: "extensionPoint"
                        jsonTag: "namespaces"
                        ____label: "namespaces"
                        ____description: "collection of namespace declarations."
                        componentArchetype: {
                            namespaceType: "component"
                            jsonTag: "namespace"
                            ____label: "namespace"
                            ____description: "ONMjs component namespace declaration."
                            ____getLabelVariant: "jsonTagAndNamespaceType"
                            namespaceProperties: 
                                userImmutable:
                                    revision:
                                        ____type: "integer"
                                        defaultValue: 0
                                    uuid:
                                        ____type: "uuid"
                                        fnCreate: -> uuid.v4()
                                    uuidRevision:
                                        ____type: "uuid"
                                        fnCreate: -> uuid.v4()
                                userMutable:
                                    namespaceType:
                                        ____type: "Must be 'child' or 'extensionPoint' or 'component'"
                                        defaultValue: "invalid"
                                    jsonTag:
                                        ____type: "JSON tag string"
                                        defaultValue: ""
                                    ____label:
                                        ____type: "String"
                                        defaultValue: ""
                                    ____description:
                                        ____type: "String"
                                        defaultValue: ""
                            subNamespaces: [
                                ONMjs.dataModels.implementation.selfDeclaration.namespaceProperties 
                                ONMjs.dataModels.implementation.selfDeclaration.namespaceMetaProperties 
                                {
                                    namespaceType: "extensionPoint"
                                    jsonTag: "namespaces"
                                    ____label: "namespaces"
                                    ____description: "Subnamespace collection."
                                    componentArchetypePath: "littleDragon.dragonEggs.dragonEgg.namespaces.namespace"
                                }
                            ]
                        } # subnamespaceDeclaration
                    }
                ]
            }
        }
    ]

    semanticBindings:
        getUniqueKey: (data_) -> data_.uuid
        update: (data_) ->
            if data_.revision? then data_.revision++
            if data_.uuidRevision? then data_.uuidRevision = uuid.v4()
        getLabel: (data_, namespaceDescriptor_) ->
            try
                defaultLabel = namespaceDescriptor_.label? and namespaceDescriptor_.label or "<no default label specified>"

                if not (namespaceDescriptor_.namespaceModelDeclaration.____getLabelVariant? and namespaceDescriptor_.namespaceModelDeclaration.____getLabelVariant)
                    return defaultLabel

                switch namespaceDescriptor_.namespaceModelDeclaration.____getLabelVariant
                    when "jsonTagAndNamespaceType"
                        if data_.jsonTag? and data_.jsonTag
                            return "#{data_.jsonTag} (#{data_.namespaceType})"
                        break

                    when "jsonTagAndValue"
                        if data_.jsonTag? and data_.jsonTag
                            return "'#{data_.jsonTag}': '#{data_.value}'"
                        break

                    else
                       throw "Unrecognized getLabelVariant string specified."
                
                return namespaceDescriptor_.namespaceModelDeclaration.____label

            catch exception
                throw "Failed in getLabel: #{exception}"

}