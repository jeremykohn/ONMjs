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
ONMjs.implementation = ONMjs.implementation? and ONMjs.implementation or ONMjs.implementation = {}

#
#
# ****************************************************************************
class ONMjs.implementation.AddressDetails
    constructor: (address_, model_, tokenVector_) ->
        try
            @address = (address_? and address_) or throw "Internal error missing address input parameter."
            @model = (model_? and model_) or throw "Internal error missing model input paramter."

            # --------------------------------------------------------------------------
            @getModelPath = =>
                try
                    if not @tokenVector.length then throw "Invalid address contains no address tokens."
                    lastToken = @getLastToken()
                    return lastToken.namespaceDescriptor.path
                catch exception
                    throw "ONMjs.implementation.AddressDetails.getModelPathFromAddress failure: #{exception}"

            # --------------------------------------------------------------------------
            @getModelDescriptorFromSubpath = (subpath_) =>
                try
                    path = "#{@getModelPath()}.#{subpath_}"
                    return @model.implementation.getNamespaceDescriptorFromPath(path)
                catch exception
                    throw "ONMjs.implementation.AddressDetails.getModelDescriptorFromSubpath failure: #{exception}"

            # --------------------------------------------------------------------------
            @createSubpathIdAddress = (pathId_) =>
                try
                    if not (pathId_?  and pathId_ > -1) then throw "Missing namespace path ID input parameter."
                    addressedComponentToken = @getLastToken()
                    addressedComponentDescriptor = addressedComponentToken.componentDescriptor
                    targetNamespaceDescriptor = @model.implementation.getNamespaceDescriptorFromPathId(pathId_)
                    if targetNamespaceDescriptor.idComponent != addressedComponentDescriptor.id
                        throw "Invalid path ID specified does not resolve to a namespace in the same component as the source address."
                    newToken = new ONMjs.implementation.AddressToken(@model, addressedComponentToken.idExtensionPoint, addressedComponentToken.key, pathId_)
                    newTokenVector = @tokenVector.length > 0 and @tokenVector.slice(0, @tokenVector.length - 1) or []
                    newTokenVector.push newToken
                    newAddress = new ONMjs.Address(@model, newTokenVector)
                    return newAddress
                catch exception
                    throw "ONMjs.implementation.AddressDetails.createSubpathIdAddress failure: #{exception}"

            # --------------------------------------------------------------------------
            @pushToken = (token_) =>
                try
                    if @tokenVector.length
                        parentToken = @tokenVector[@tokenVector.length - 1]
                        @validateTokenPair(parentToken, token_)

                    @tokenVector.push token_.clone()

                    if token_.componentDescriptor.id == 0
                        @complete = true

                    if token_.keyRequired
                        @keysRequired = true

                    if not token_.isQualified()
                        @keysSpecified = false

                    # Pushing a token changes the address so we must clear any per-address cached data.
                    @humanReadableString = undefined
                    @hashString = undefined
                    @address

                catch exception
                    throw "ONMjs.implementation.AddressDetails.pushToken failure: #{exception}"

            # --------------------------------------------------------------------------
            @validateTokenPair = (parentToken_, childToken_) ->
                try
                    if not (parentToken_? and parentToken_ and childToken_? and childToken_)
                        throw "Internal error: input parameters are not correct."

                    if not childToken_.keyRequired
                        throw "Child token is invalid because it specifies a namespace in the root component."

                    if parentToken_.namespaceDescriptor.id != childToken_.extensionPointDescriptor.id
                        throw "Child token is invalid because the parent token does not select the required extension point namespace."

                    if not parentToken_.isQualified() and childToken_.isQualified()
                        throw "Child token is invalid because the parent token is unqualified and the child is qualified."
                    true

                catch exception
                    throw "ONMjs.implementation.AddressDetails.validateTokenPair the specified parent and child tokens are incompatible and cannot be used to form an address: #{exception}"

            # --------------------------------------------------------------------------
            @getLastToken = =>
                try
                    if not @tokenVector.length
                        throw "Illegal call to getLastToken on uninitialized address class instance."
                    @tokenVector[@tokenVector.length - 1]
                catch exception
                    throw "ONMjs.implementation.AddressDetails.getLastToken failure: #{exception}"

            # --------------------------------------------------------------------------
            @getDescriptor = =>
                try
                    return @getLastToken().namespaceDescriptor
                catch exception
                    throw "ONMjs.implementation.AddressDetails.getDescriptor failure: #{exception}"


            # --------------------------------------------------------------------------
            # CONSTRUCTOR
            # --------------------------------------------------------------------------

            @tokenVector = []
            @parentExtensionPointId = -1

            # Addresses are said to be either complete or partial.
            # A complete address has one or more tokens and the first token refers to the root component.
            # A partial address has one or more tokens and the first token refers to a non-root component.
            @complete = false # set true iff first token refers to the root component

            # Addresses are said to be either complete or partial.
            # A complete address has one or more tokens and the first token refers to the root component.
            # A partial address has one or more tokens and the first token refers to a non-root component.
            @keysRequired = false
            @keysSpecified = true

            # Performs cloning and validation
            for token in tokenVector_? and tokenVector_ or []
                @pushToken token

            # The following globals are used to cache namesapce traversal paths
            # on the first call to the related vistor function. Subsequent calls
            # on the same address object do not incur the overhead of recalculation.
            @parentAddressesAscending = undefined
            @parentAddressesDescending = undefined
            @subnamespaceAddressesAscending = undefined
            @subnamespaceAddressesDescending = undefined
            @subcomponentAddressesAscending = undefined
            @subcomponentsAddressesDescending = undefined

            @humanReadableString = undefined
            @hashString = undefined

        catch exception
            throw "ONMjs.implementation.AddressDetails failure: #{exception}"



#
#
# ****************************************************************************
class ONMjs.Address

    constructor: (model_, tokenVector_) ->
        try
            @model = model_? and model_ or throw "Missing required object model input parameter."
            @implementation = new ONMjs.implementation.AddressDetails(@, model_, tokenVector_)

            # Addresses are said to be either complete or partial.
            # A complete address has one or more tokens and the first token refers to the root component.
            # A partial address has one or more tokens and the first token refers to a non-root component.
            @isComplete = => @implementation.complete

            # Addresses are said to be either qualified or unqualified.
            # A qualified address contains tokens that all specifiy a key (if required). Qualified addresses
            # may be resolved against a Store object when they're also complete addresses.
            # An unqualified address contains one or more tokens that do not specify a key (where required).
            # Unqualified addresses may only be used to create new components within a Store instance.
            @isQualified = => not @implementation.keysRequired or @implementation.keysSpecified

            # Addresses are said to be resolvable, creatable, or unresolvable
            # A resolvable address is both complete and qualified meaning that it specifies both a complete
            # and unambiguous chain of tokens leading to the addressed namespace. A creatable address is
            # a complete but unqualified address. A creatable address may be used to create a component but
            # cannot be used to open a namespace. All incomplete addresses are by definition unresolvable;
            # because both namespace create and open operations performed by an object store must be able
            # to verify the entire path to the target namespace and this cannot be done if the first token
            # in an address does not address the store's root component.
            @isResolvable = => @isComplete() and @isQualified()
            @isCreatable = => @isComplete() and @implementation.keysRequired and not @implementation.keysSpecified

        catch exception
            throw "ONMjs.Address error: #{exception}"

    #
    # ============================================================================
    getHumanReadableString: =>
        try
            if @implementation.humanReadableString? and @implementation.humanReadableString
                return @implementation.humanReadableString

            index = 0
            humanReadableString = ""

            for token in @implementation.tokenVector
                if not index
                    humanReadableString += "#{token.model.jsonTag}."

                if token.key? and token.key
                    humanReadableString += ".#{token.key}."
                else
                    if token.idExtensionPoint > 0
                        humanReadableString += "-"
                    
                humanReadableString += "#{token.idNamespace}"
                index++

            @implementation.humanReadableString = humanReadableString
            return humanReadableString

        catch exception
            throw "ONMjs.Address.getHumanReadableString failure: #{exception}"



    #
    # ============================================================================
    getHashString: =>
        try
            if @implementation.hashString? and @implementation.hashString
                return @implementation.hashString

            humanReadableString = @getHumanReadableString()

            # Given that an ONMjs object model is a singly-rooted tree structure, the raw
            # hash strings of different addresses created for the same object model all share
            # a common string prefix. All the information in the hash string is required to
            # reconstruct the address if the hash is used as a URN. However, for local in-app
            # processing, address hash strings are used as dictionary keys typically (e.g.
            # to open observer state). Speed equality/relational operations on hash string
            # by reversing the raw string (so that the common prefix appears at the tail
            # and does not need to evaluated typically). Note that WE DO NOT CARE if we break
            # Unicode character encoding here; the string is base64 encoded anyway and is
            # generally meaningless to humans, and the original string may be recovered
            # by reversing the process. https://github.com/mathiasbynens/esrever is a good
            # sample of how one should reverse a string if maintaining Unicode is important.
            # reversedHashString = humanReadableString.split('').reverse().join('')

            @implementation.hashString = encodeURIComponent(humanReadableString).replace(/[!'()]/g, escape).replace(/\*/g, "%2A")
            #@implementation.hashString = window.btoa(reversedHashString)
            return @implementation.hashString
            
        catch exception
            throw "ONMjs.Address.getHashString failure: #{exception}"

    #
    # ============================================================================
    isRoot: =>
        try
            @implementation.getLastToken().idNamespace == 0

        catch exception
            throw "CNMjs.Address.isRoot failure: #{exception}"

    #
    # ============================================================================
    isEqual: (address_) =>
        try
            if not (address_? and address_) then throw "Missing address input parameter."
            if @implementation.tokenVector.length != address_.implementation.tokenVector.length then return false
            result = true
            index = 0
            while index < @implementation.tokenVector.length
                tokenA = @implementation.tokenVector[index]
                tokenB = address_.implementation.tokenVector[index]
                if not tokenA.isEqual(tokenB)
                    result = false
                    break
                index++
            return result
        catch exception
            throw "ONMjs.Address.isEqual failure: #{exception}"

    #
    # ============================================================================
    clone: => 
        try
            new ONMjs.Address(@model, @implementation.tokenVector)
        catch exception
            throw "ONMjs.Address.clone failure: #{exception}"
 


    #
    # ============================================================================
    createParentAddress: (generations_) =>
        try
            if not @implementation.tokenVector.length then throw "Invalid address contains no address tokens."

            generations = generations_? and generations_ or 1
            tokenSourceIndex = @implementation.tokenVector.length - 1
            token = @implementation.tokenVector[tokenSourceIndex--]

            if token.namespaceDescriptor.id == 0
                return undefined

            while generations
                descriptor = token.namespaceDescriptor

                # If we have reached the root descriptor we're done regardless of the number
                # of generations the caller requested.

                if descriptor.id == 0
                    break

                # If the current descriptor is within a component (i.e. not the component root)
                # then descriptor.parent.id indicates its parent ID from which we can trivially
                # update the current address token.
                #
                # However, if the current descriptor is the root of a component then its parent
                # is by definition an extension point. What makes this complicated is that 
                # the mapping of extension point ID to component ID is 1:1 but the converse is not
                # necessarily true. Component ID to containing extension point ID is 1:N potentially
                # because ONM allows extension points to specify the actual component declaration
                # or to specify a reference to some other component.

                if descriptor.namespaceType != "component"
                    token = new ONMjs.implementation.AddressToken(token.model, token.idExtensionPoint, token.key, descriptor.parent.id)
                else
                    token = (tokenSourceIndex != -1) and @implementation.tokenVector[tokenSourceIndex--] or throw "Internal error: exhausted token stack."

                generations--
                
            newTokenVector = ((tokenSourceIndex < 0) and []) or @implementation.tokenVector.slice(0, tokenSourceIndex + 1)
            newAddress = new ONMjs.Address(token.model, newTokenVector)
            newAddress.implementation.pushToken(token)
            return newAddress

        catch exception
            throw "ONMjs.Address.createParentAddress failure: #{exception}"


    #
    # ============================================================================
    createSubpathAddress: (subpath_) =>
        try
            if not (subpath_? and subpath_) then throw "Missing subpath input parameter."
            subpathDescriptor = @implementation.getModelDescriptorFromSubpath(subpath_)
            baseDescriptor = @implementation.getDescriptor()

            if ((baseDescriptor.namespaceType == "extensionPoint") and (subpathDescriptor.namespaceType != "component"))
                throw "Invalid subpath string must begin with the name of the component contained by the base address' extension point."

            baseDescriptorHeight = baseDescriptor.parentPathIdVector.length
            subpathDescriptorHeight = subpathDescriptor.parentPathIdVector.length

            if ((subpathDescriptorHeight - baseDescriptorHeight) < 1)
                throw "Internal error due to failed consistency check."

            subpathParentIdVector = subpathDescriptor.parentPathIdVector.slice(baseDescriptorHeight + 1, subpathDescriptorHeight)
            subpathParentIdVector.push subpathDescriptor.id
            baseTokenVector = @implementation.tokenVector.slice(0, @implementation.tokenVector.length - 1) or []
            newAddress = new ONMjs.Address(@model, baseTokenVector)
            token = @implementation.getLastToken().clone()
        
            for pathId in subpathParentIdVector
                descriptor = @model.implementation.getNamespaceDescriptorFromPathId(pathId)

                switch descriptor.namespaceType
                    when "component"
                        newAddress.implementation.pushToken(token)
                        token = new ONMjs.implementation.AddressToken(token.model, token.namespaceDescriptor.id, undefined, pathId)
                        break
                    else
                        token = new ONMjs.implementation.AddressToken(token.model, token.idExtensionPoint, token.key, pathId)

            newAddress.implementation.pushToken(token)
            return newAddress

        catch exception
            throw "ONMjs.Address.createSubpathAddress failure: #{exception}"


    #
    # ============================================================================
    createComponentAddress: =>
        try
            descriptor = @implementation.getDescriptor()
            if descriptor.isComponent
                return @clone()
            newAddress = @implementation.createSubpathIdAddress(descriptor.idComponent)
            return newAddress
        catch exception
            throw "ONMjs.Address.createComponentAddress failure: #{exception}"

    #
    # ============================================================================
    createSubcomponentAddress: =>
        try
            descriptor = @implementation.getDescriptor()
            if descriptor.namespaceType != "extensionPoint"
                throw "Unable to determine subcomponent to create because this address does not specifiy an extension point namespace."
            newToken = new ONMjs.implementation.AddressToken(@model, descriptor.id, undefined, descriptor.archetypePathId)
            @clone().implementation.pushToken(newToken)
        catch exception
            throw "ONMjs.Address.createSubcomponentAddress failure: #{exception}"

    #
    # ============================================================================
    getModel: =>
        try
            return @implementation.getDescriptor().namespaceModelDeclaration

        catch exception
            throw "ONMjs.Address.getModel failure: #{exception}"


    #
    # ============================================================================
    getPropertiesModel: =>
        try
            return @implementation.getDescriptor().namespaceModelPropertiesDeclaration

        catch exception
            throw "ONMjs.Address.getPropertiesModel failure: #{exception}"

    #
    # ============================================================================
    visitParentAddressesAscending: (callback_) =>
        try
            if not (callback_? and callback_) then return false
            if not (@parentAddressesAscending? and @parentAddressesAscending)
                @parentAddressesAscending = []
                @visitParentAddressesDescending( (address__) => @parentAddressesAscending.push(address__); true )
                @parentAddressesAscending.reverse()
            if not @parentAddressesAscending.length then return false
            for address in @parentAddressesAscending
                try
                    callback_(address)
                catch exception
                    throw "Failure occurred inside your registered callback function implementation: #{exception}"
            true
        catch exception
            throw "ONMjs.Address.visitParentAddressesAscending failure: #{exception}"
        
    #
    # ============================================================================
    visitParentAddressesDescending: (callback_) =>
        try
            if not (callback_? and callback_) then return false
            if not (@parentAddressesDesending? and @parentAddressesDesceding)
                @parentAddressesDescending = []
                parent = @createParentAddress()
                while parent
                    @parentAddressesDescending.push parent
                    parent = parent.createParentAddress()
            if not @parentAddressesDescending.length then return false
            for address in @parentAddressesDescending
                try
                    callback_(address)
                catch exception
                    throw "Failure occurred inside your registered callback function implementation: #{exception}"
            true
        catch exception
            throw "ONMjs.Address.visitParentAddressesDescending failure: #{exception}"

    #
    # ============================================================================
    visitSubaddressesAscending: (callback_) =>
        try
            if not (callback_? and callback_) then return false
            if not (@subnamespaceAddressesAscending? and @subnamespaceAddressesAscending)
                @subnamespaceAddressesAscending = []
                namespaceDescriptor = @implementation.getDescriptor()
                for subnamespacePathId in namespaceDescriptor.componentNamespaceIds
                    subnamespaceAddress = @implementation.createSubpathIdAddress(subnamespacePathId)
                    @subnamespaceAddressesAscending.push subnamespaceAddress
            for address in @subnamespaceAddressesAscending
                try
                    callback_(address)
                catch exception
                    throw "Failure occurred inside your registered callback function implementation: #{exception}"
            true
        catch exception
            throw "ONMjs.Address.visitSubaddressesAscending failure: #{exception}"

    #
    # ============================================================================
    visitSubaddressesDescending: (callback_) =>
        try
            if not (callback_ and callback_) then return false
            if not (@subnamespaceAddressesDescending? and @subnamespaceAddressesDescending)
                @subnamespaceAddressesDescending = []
                @visitSubaddressesAscending( (address__) => @subnamespaceAddressesDescending.push address__ )
                @subnamespaceAddressesDescending.reverse()
            for address in @subnamespaceAddressesDescending
                try
                    callback_(address)
                catch exception
                    throw "Failure occurred inside your registered callback function implementation: #{exception}"
            true
        catch exception
            throw "ONMjs.Address.visitSubaddressesAscending failure: #{exception}"



    #
    # ============================================================================
    visitChildAddresses: (callback_) =>
        try
            if not (callback_? and callback_) then return false
            namespaceDescriptor = @implementation.getDescriptor()
            for childDescriptor in namespaceDescriptor.children
                childAddress = @implementation.createSubpathIdAddress(childDescriptor.id)
                try
                    callback_(childAddress)
                catch exception
                    throw "Failure occurred inside your registered callback function implementation: #{exception}"
            true
        catch exception
            throw "ONMjs.Address.visitChildAddresses failure: #{exception}"

    #
    # ============================================================================
    visitExtensionPointAddresses: (callback_) =>
        try
            if not (callback_? and callback_) then return false
            if not (@extensionPointAddresses? and @extensionPointAddresses)
                @extensionPointAddresses = []
                namespaceDescriptor = @implementation.getDescriptor()
                for path, extensionPointDescriptor of namespaceDescriptor.extensionPoints
                    extensionPointAddress = @implementation.createSubpathIdAddress(extensionPointDescriptor.id)
                    @extensionPointAddresses.push extensionPointAddress
            for address in @extensionPointAddresses
                callback_(address)
            true # that
        catch exception
            throw "ONMjs.Address.visitExtensionPointAddresses failure: #{exception}"

