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
# encapsule-lib-console.coffee
#

class window.Console
    constructor: ->

    @init: =>

        consoleEl = $("#idConsole")
        if not consoleEl? or not consoleEl
            return false
        consoleEl.html("")
        return true

    @log: (trace) =>
        if console? and console and console.log? and console.log
           console.log trace


    @message: (trace) =>
        @messageStart(trace)
        @messageEnd("")

    @messageRaw: (trace) => 
        consoleEl = $("#idConsole")
        consoleEl.append(trace)

    @messageStart: (trace) => Console.messageRaw("> #{trace}")

    @messageEnd: (trace) => Console.messageRaw("#{trace}<br>")


    @messageError: (errorException) =>
        errorMessage =
            """
            <div class="classConsoleExceptionContainer">ERROR: #{errorException}</div>
            """

        Console.messageRaw(errorMessage)
        @log("!!!! #{errorException}")




