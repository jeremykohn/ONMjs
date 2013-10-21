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


ONMjs.dataModels.selfDeclaration = {
    namespaceType: "root"
    jsonTag: "ONMjsDataModelDeclaration"
    ____label: "Data Model Declaration"
    ____description: "ONMjs data model declaration."

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
        {
            namespaceType: "extensionPoint"
            jsonTag: "namespaceDeclarations"
            ____label: "namespaces"
            ____description: "collection of namespace declarations."
            componentArchetype: {
                namespaceType: "component"
                jsonTag: "namespaceDeclaration"
                ____label: "namespaces"
                ____description: "Subnamespace collection."

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
                    {
                        namespaceType: "extensionPoint"
                        jsonTag: "subnamespaceDeclarations"
                        ____label: "namespaces"
                        ____description: "Subnamespace collection."
                        componentArchetypePath: "ONMjsDataModelDeclaration.namespaceDeclarations.namespaceDeclaration"
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
                if data_.jsonTag? and data_.jsonTag
                    return "'#{data_.jsonTag}' (#{data_.namespaceType})"

                return namespaceDescriptor_.label

            catch exception
                throw "Failed in getLabel: #{exception}"

}