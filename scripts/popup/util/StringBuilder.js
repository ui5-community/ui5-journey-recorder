sap.ui.define(["sap/ui/base/Object"],
    function (BaseObject) {
        "use strict";

        var ItemConstants = BaseObject.extend("com.ui5.testing.util.StringBuilder", {
            //#region chaining methods
            /**
             * Simple constructor, allowing a string as parameter to start with
             *
             * @param {string} sString the text part to start with
             *
             * @return {com.ui5.testing.util.StringBuilder} self reference for chaining
             */
            constructor: function (sString) {
                this._aParts = [];
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
                if (typeof sString !== "undefined" && sString !== "") {
                    //added "" + just to ensure it is a string for further actions
                    this._aParts.push("" + sString);
                }
                return this;
            },

            /**
             * Add multiple string parts to the whole final string build.
             * 
             * @param {string[]} aItems the items to add
             * @param {string} [sSeparator=""] a possible separator string to add between the items 
             *
             * @returns {com.ui5.testing.util.StringBuilder} self reference for chaining
             */
            addMultiple: function (aItems, sSeparator) {
                sSeparator = sSeparator ? sSeparator : "";
                aItems.forEach(function (a, i, arr) {
                    this.add(a);
                    if (i < arr.length - 1) {
                        this.add(sSeparator);
                    }
                }, this);
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
                    this._aParts.push(Array(iTimes + 1).join('\t'));
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
                    this._aParts.push(Array(iTimes + 1).join('\n'));
                } else {
                    this._aParts.push('\n');
                }
                return this;
            },

            /**
             * 
             * @param {string|regex} sTarget the target signs to replace
             * @param {string} sReplacement the string added as replacement
             * @param {number} [iIndex] the index of the text token to replace the text, if not assigned it uses the last token
             *
             * @returns {com.ui5.testing.util.StringBuilder} self reference for chaining
             */
            replace: function (sTarget, sReplacement, iIndex) {
                sReplacement = sReplacement ? sReplacement : "";
                iIndex = iIndex ? iIndex : this._aParts.length - 1;
                if (iIndex < 0) {
                    return this;
                }
                this._aParts[iIndex] = this._aParts[iIndex].replace(sTarget, sReplacement);
                return this;
            },
            //#endregion
            //#region no chaining methods

            /**
             * Returns the number of already added text token.
             *
             * @returns {number} the number of text tokens
             */
            getNumberOfTextToken: function () {
                return this._aParts.length;
            },

            /**
             * Simple to string method to return the string out of all parts
             *
             * @returns {string} the final string
             */
            toString: function () {
                return this._aParts.join("");
            }
            //#endregion
        });
        return ItemConstants;
    });