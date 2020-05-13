sap.ui.define(["sap/ui/base/Object"],
    function (BaseObject) {
        "use strict";

        var ItemConstants = BaseObject.extend("com.ui5.testing.util.StringBuilder", {
            _aParts: [],

            /**
             * Simple constructor, allowing a string as parameter to start with
             *
             * @param {string} sString the text part to start with
             *
             * @return {com.ui5.testing.util.StringBuilder} self reference for chaining
             */
            constructor: function (sString) {
                this.add(sString);
                return this;
            },

            /**
             * Adds a string as part of the whole final string build up.
             *
             * @param {string} sString the text snippet to add
             *
             * @returns {com.ui5.testing.util.StringBuilder} self reference for chaining
             */
            add: function (sString) {
                if (sString) {
                    this._aParts.push(sString);
                }
                return this;
            },

            /**
             * Add one ore more tabs depending on user purpose
             *
             * @param {number} [iTimes=1]  the number of times to add a tab stop.
             *
             * @returns {com.ui5.testing.util.StringBuilder} self reference for chaining
             */
            addTab: function (iTimes) {
                if (iTimes) {
                    this._aParts.push(Array(iTimes).join('\t'));
                } else {
                    this._aParts.push('\t');
                }
                return this;
            },

            /**
             * Add one ore more new line on user purpose
             *
             * @param {number} [iTimes=1] the number of times to add a new line.
             *
             * @returns {com.ui5.testing.util.StringBuilder} self reference for chaining
             */
            addNewLine: function (iTimes) {
                if (iTimes) {
                    this._aParts.push(Array(iTimes).join('\n'));
                } else {
                    this._aParts.push('\n');
                }
                return this;
            },

            /**
             * Simple to string method to return the string out of all parts
             *
             * @returns {string} the final string
             */
            toString: function () {
                return this._aParts.join("");
            }
        });
        return ItemConstants;
    });