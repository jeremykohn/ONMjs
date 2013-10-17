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

GenericTest implements handlers for all signals defined by ONMjs. Once registered
with an ONMjs.Store, GenericTest serializes telemetry information back via
BackChannel.log.

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
ONMjs.observers = ONMjs.observers? and ONMjs.observers or ONMjs.observers = {}

class ONMjs.observers.GenericTest
    constructor: (backchannel_) ->
        @backchannel = backchannel_? and backchannel_ or throw "Missing backchannel input parameter."

        @callbackInterface = {

            onObserverAttachBegin: (store_, observerId_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onObserverAttachBegin")

            onObserverAttachEnd: (store_, observerId_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onObserverAttachEnd")

            onObserverDetachBegin: (store_, observerId_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onObserverDetachBegin")

            onObserverDetachEnd: (store_, observerId_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onObserverDetachEnd")

            onComponentCreated: (store_, observerId_, address_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onComponentCreated(#{address_.getHumanReadableString()})")

            onComponentUpdated: (store_, observerId_, address_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onComponentUpdated(#{address_.getHumanReadableString()})")

            onComponentRemoved: (store_, observerId_, address_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onComponentRemoved(#{address_.getHumanReadableString()})")

            onNamespaceCreated: (store_, observerId_, address_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onNamespaceCreated(#{address_.getHumanReadableString()})")

            onNamespaceUpdated: (store_, observerId_, address_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onNamespaceUpdated(#{address_.getHumanReadableString()})")

            onNamespaceRemoved: (store_, observerId_, address_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onNamespaceRemoved(#{address_.getHumanReadableString()})")

            onSubNamespaceUpdated: (store_, observerId_, address_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onSubNamespaceUpdated(#{address_.getHumanReadableString()})")

            onSubComponentUpdated: (store_, observerId_, address_) =>
                @backchannel.log("ONMjs_#{store_.jsonTag}Observer::#{observerId_}::onSubComponentUpdated(#{address_.getHumanReadableString()})")
        }       
