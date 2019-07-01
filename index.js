/*
 **  DatamodelJS - Entity management
 **  Design and Development by msg Applied Technology Research
 **  Copyright (c) 2013 - 2016 msg systems ag (http://www.msg-systems.com/)
 **
 **  Permission is hereby granted, free of charge, to any person obtaining
 **  a copy of this software and associated documentation files (the
 **  "Software"), to deal in the Software without restriction, including
 **  without limitation the rights to use, copy, modify, merge, publish,
 **  distribute, sublicense, and/or sell copies of the Software, and to
 **  permit persons to whom the Software is furnished to do so, subject to
 **  the following conditions:
 **
 **  The above copyright notice and this permission notice shall be included
 **  in all copies or substantial portions of the Software.
 **
 **  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 **  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 **  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 **  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 **  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 **  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 **  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function ($) {
    $(document).ready(function () {
        var dm = datamodeljs.dm()
        var personSpec = {}
        var personObj = {}
        var syntax = new Syntax({
            language: 'js',
            cssPrefix: "syntax-"
        })
        syntax.config({})
        var internals = ["_className", "_isDirty", "_isTransient", "_isStub", "_isDeleted"]
        var cleanSimpleExample = function () {
            try {
                dm.destroyAll('Person')
                dm.undefine('Person')
            }
            catch (e) {
            }
        }
        var bootstrapSimpleExample = function () {
            dm.define('Person', personSpec)
            dm.create('Person', personObj)
        }
        var bootstrapRelationShipExample = function () {
            dm.define("TodoList", {
                "id": "@number",
                "name": "string",
                "tasks": "TodoTask*"
            })
            dm.define("TodoTask", {
                "id": "@number",
                "assignee": "string",
                "desc": "string",
                "state": "string"
            })
            dm.create("TodoTask", {
                "id": 1,
                "assignee": "Max Mustermann",
                "desc": "Cut the grass",
                "state": "open"
            })
            dm.create("TodoList", {
                "id": 1,
                "name": "Tasks@Home",
                "tasks": [
                    1,
                    {
                        "id": 2,
                        "assignee": "Susan Mustermann",
                        "desc": "Wash the dishes",
                        "state": "done"
                    }
                ]
            })
            var todoLists = dm.findAll('TodoList')
            $('#relationShipConsole').html(morphListOfEntitiesIntoHTML(todoLists))
            internals.forEach(function (interna) {
                $('#relationShipConsole span:contains("' + interna + '")').css('color', '#bbbbbb')
            })

        }
        var bootstrapBiDirectionalExample = function () {
            dm.define("Milestone", {
                "id": "@string",
                "name": "string",
                "tasks": "Task*"
            })
            dm.define("Task", {
                "id": "@number",
                "assignee": "string",
                "desc": "string",
                "milestone": "Milestone"
            })
            dm.create("Milestone", {
                "id": "2016/09/01",
                "name": "Release 1.0.0",
                "tasks": [1, 2]
            })
            dm.create("Task", {
                "id": 1,
                "assignee": "project leader",
                "desc": "Setup project",
                "milestone": "2016/09/01"
            })
            dm.create("Task", {
                "id": 2,
                "assignee": "build manager",
                "desc": "Prepare build environment",
                "milestone": "2016/09/01"
            })
            var todoLists = dm.findAll('Milestone')
            $('#biDirectionalConsole').html(morphListOfEntitiesIntoHTML(todoLists))
            internals.forEach(function (interna) {
                $('#biDirectionalConsole span:contains("' + interna + '")').css('color', '#bbbbbb')
            })

        }
        var cloneEntity = function (entity, callStack) {
            if (!entity || typeof entity._className !== "string")
                throw new Error("given entity is no datamodeljs entity object")
            if (callStack === undefined) callStack = []
            var cycleDetected = false
            callStack.forEach(function (cycle) {
                if (cycle === entity)
                    cycleDetected = true
            })
            if (cycleDetected)
                return "∞cycle∞ " + entity._className + " " + dm.primaryKeyValue(entity._className, entity)
            callStack.push(entity)
            var clone = {}
            if (!entity) return entity
            internals.forEach(function (interna) {
                clone[interna] = entity[interna]
            })
            for (var attr in entity) {
                if (entity[attr] && entity[attr] instanceof Array) {
                    var arr = []
                    entity[attr].forEach(function (each) {
                        arr.push(cloneEntity(each, callStack))
                    })
                    clone[attr] = arr
                } else if (typeof entity[attr] === 'object')
                    clone[attr] = cloneEntity(entity[attr], callStack)
                else
                    clone[attr] = entity[attr]
            }
            return clone
        }
        var morphListOfEntitiesIntoHTML = function (entities) {
            var output = []
            entities.forEach(function (entity) {
                output.push(cloneEntity(entity))
            })
            var text = JSON.stringify(output, null, "  ")
            return syntax.richtext(text).html()
        }
        var updateSimpleExample = function () {
            var error
            var persons
            cleanSimpleExample()
            personSpec = $('#simpleExampleSpec').val()
            personObj = $('#simpleExampleObjs').val()

            try {
                personSpec = JSON.parse(personSpec)
                personObj = JSON.parse(personObj)
                bootstrapSimpleExample()
                persons = dm.findAll('Person')
            }
            catch (e) {
                error = e.message
            }
            if (error) {
                $('#simpleExampleConsole').addClass('error').text(error)
            } else {
                $('#simpleExampleConsole').removeClass('error').html(morphListOfEntitiesIntoHTML(persons))
                internals.forEach(function (interna) {
                    $('#simpleExampleConsole span:contains("' + interna + '")').css('color', '#bbbbbb')
                })
            }
        }
        // bootstrap simpleExample
        $('#simpleExampleSpec').keyup(updateSimpleExample).change(updateSimpleExample)
        $('#simpleExampleObjs').keyup(updateSimpleExample).change(updateSimpleExample)
        updateSimpleExample()

        // bootstrap relationShipExample
        bootstrapRelationShipExample()

        // bootstrap biDirectionalExample
        bootstrapBiDirectionalExample()

        // transform all static code examples into syntax highlighting
        $('.codify').each(function () {
            var text = $(this).text()
            var html = syntax.richtext(text).html()
            $(this).html(html)
        })
    })
})(jQuery)
