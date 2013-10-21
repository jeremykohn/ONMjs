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
    ____label: "META PROPERTIES"
    ____descriptor: "Collection of this namespaces' meta-properties."
    componentArchetype:
        namespaceType: "component"
        jsonTag: "metaproperty"
        ____label: "META PROPERTY"
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
    ____label: "PROPERTY"
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
                fnCreate: -> ""
            value:
                ____type: "string"
                fnCreate: -> ""
    subNamespaces: [
        ONMjs.dataModels.implementation.selfDeclaration.namespaceMetaProperties        
    ]

ONMjs.dataModels.implementation.selfDeclaration.namespaceProperties =
    namespaceType: "child"
    jsonTag: "properties"
    ____label: "PROPERTIES"
    ____description: "Namespace properties."
    subNamespaces: [
        {
            namespaceType: "extensionPoint"
            jsonTag: "userImmutable"
            ____label: "USER IMMUTABLE PROPERTIES"
            ____description: "User immutable namespace properties."
            componentArchetype: ONMjs.dataModels.implementation.selfDeclaration.namespaceProperty 

        }

        {
            namespaceType: "extensionPoint"
            jsonTag: "userMutable"
            ____label: "USER MUTABLE PROPERTIES"
            ____description: "User mutable namespace properties."
            componentArchetype: ONMjs.dataModels.implementation.selfDeclaration.namespaceProperty 

        }


    ]


ONMjs.dataModels.selfDeclaration = {
    namespaceType: "root"
    jsonTag: "dataModelDeclaration"
    ____label: "ONMJS DATA MODEL DECLARATION"
    ____description: "ONMjs data model declaration."
    ____getLabelVariant: "jsonTagAndNamespaceType"

    namespaceProperties: 
        userImmutable:
            revision:
                fnCreate: -> 0
            uuid:
                fnCreate: -> uuid.v4()
            uuidRevision:
                fnCreate: -> uuid.v4()
            namespaceType:
                fnCreate: -> "root"
        userMutable:
            jsonTag:
                ____type: "JSON tag string"
                fnCreate: -> ""
            ____label:
                ____type: "String"
                fnCreate: -> ""
            ____description:
                ____type: "String"
                fnCreate: -> ""

    subNamespaces: [

        ONMjs.dataModels.implementation.selfDeclaration.namespaceProperties 
        ONMjs.dataModels.implementation.selfDeclaration.namespaceMetaProperties 

        {
            namespaceType: "extensionPoint"
            jsonTag: "namespaces"
            ____label: "NAMESPACES"
            ____description: "collection of namespace declarations."
            componentArchetype: {
                namespaceType: "component"
                jsonTag: "namespace"
                ____label: "NAMESPACE"
                ____description: "ONMjs component namespace declaration."
                ____getLabelVariant: "jsonTagAndNamespaceType"

                namespaceProperties: 
                    userImmutable:
                        revision:
                            fnCreate: -> 0
                        uuid:
                            fnCreate: -> uuid.v4()
                        uuidRevision:
                            fnCreate: -> uuid.v4()
                    userMutable:
                        namespaceType:
                            ____type: "Must be 'child' or 'extensionPoint' or 'component'"
                            fnCreate: -> "invalid"
                        jsonTag:
                            ____type: "JSON tag string"
                            fnCreate: -> ""
                        ____label:
                            ____type: "String"
                            fnCreate: -> ""
                        ____description:
                            ____type: "String"
                            fnCreate: -> ""

                subNamespaces: [

                    ONMjs.dataModels.implementation.selfDeclaration.namespaceProperties 
                    ONMjs.dataModels.implementation.selfDeclaration.namespaceMetaProperties 

                    {
                        namespaceType: "extensionPoint"
                        jsonTag: "namespaces"
                        ____label: "NAMESPACES"
                        ____description: "Subnamespace collection."
                        componentArchetypePath: "dataModelDeclaration.namespaces.namespace"
                    }
                ]
            } # subnamespaceDeclaration
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