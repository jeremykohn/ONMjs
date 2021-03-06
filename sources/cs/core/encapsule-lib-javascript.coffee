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
Low-level library routines inspired by (and often copied) from http://coffeescriptcookbook.com
------------------------------------------------------------------------------
###
#
#
#
#

namespaceEncapsule = Encapsule? and Encapsule or @Encapsule = {}
Encapsule.code = Encapsule.code? and Encapsule.code or @Encapsule.code = {}
Encapsule.code.lib = Encapsule.code.lib? and Encapsule.code.lib or @Encapsule.code.lib = {}
Encapsule.code.lib.js = Encapsule.code.lib.js? and Encapsule.code.lib.js or @Encapsule.code.lib.js = {}


# Copied from http://coffeescriptcookbook.com/chapters/classes_and_objects/cloning

Encapsule.code.lib.js.clone = (object_) ->
    # \ BEGIN: clone function
    try
        # \ BEGIN: try
        if not object_? or typeof object_ isnt 'object'
            return object_

        if object_ instanceof Date
            return new Date(object_.getTime()) 

        if object_ instanceof RegExp
            flags = ''
            flags += 'g' if object_.global?
            flags += 'i' if object_.ignoreCase?
            flags += 'm' if object_.multiline?
            flags += 'y' if object_.sticky?
            return new RegExp(object_.source, flags) 

        newInstance = new object_.constructor()

        for key of object_
            newInstance[key] = Encapsule.code.lib.js.clone object_[key]

        return newInstance
        # / END: try

    catch exception
        throw "Encapsule.code.lib.js.clone: #{exception}"

    # / END: clone function


Encapsule.code.lib.js.dictionaryLength = (dictionary_) ->
    try
        Object.keys(dictionary_).length
    catch exception
        throw "Encapsule.code.lib.js.dictionaryLength: #{exception}"

