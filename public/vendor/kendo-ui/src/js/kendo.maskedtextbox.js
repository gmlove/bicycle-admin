/*
* Kendo UI Web v2014.1.318 (http://kendoui.com)
* Copyright 2014 Telerik AD. All rights reserved.
*
* Kendo UI Web commercial licenses may be obtained at
* http://www.telerik.com/purchase/license-agreement/kendo-ui-web
* If you do not own a commercial license, this file shall be governed by the
* GNU General Public License (GPL) version 3.
* For GPL requirements, please review: http://www.gnu.org/copyleft/gpl.html
*/
(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

(function($, undefined) {
    var kendo = window.kendo;
    var caret = kendo.caret;
    var keys = kendo.keys;
    var ui = kendo.ui;
    var Widget = ui.Widget;
    var ns = ".kendoMaskedTextBox";
    var proxy = $.proxy;

    var INPUT_EVENT_NAME = (kendo.support.propertyChangeEvent ? "propertychange" : "input") + ns;
    var STATEDISABLED = "k-state-disabled";
    var DISABLED = "disabled";
    var READONLY = "readonly";
    var CHANGE = "change";

    var MaskedTextBox = Widget.extend({
        init: function(element, options) {
            var that = this;
            var DOMElement;

            Widget.fn.init.call(that, element, options);

            that._rules = $.extend({}, that.rules, that.options.rules);

            element = that.element;
            DOMElement = element[0];

            that.wrapper = element;
            that._tokenize();
            that._reset();

            that.element
                .addClass("k-textbox")
                .attr("autocomplete", "off")
                .on("focus" + ns, function() {
                    that._oldValue = DOMElement.value;

                    if (!element.val()) {
                        DOMElement.value = that._old = that._emptyMask;
                    } else {
                        that._timeoutId = setTimeout(function() {
                            element.select();
                        });
                    }
                })
                .on("blur" + ns, function() {
                    clearTimeout(that._timeoutId);

                    if (element.val() === that._emptyMask) {
                        DOMElement.value = that._old = "";
                    }

                    that._change();
                });

             var disabled = element.is("[disabled]");

             if (disabled) {
                 that.enable(false);
             } else {
                 that.readonly(element.is("[readonly]"));
             }

             that.value(that.options.value || element.val());

             kendo.notify(that);
        },

        options: {
            name: "MaskedTextBox",
            promptChar: "_",
            culture: "",
            rules: {},
            value: "",
            mask: ""
        },

        events: [
            CHANGE
        ],

        rules: {
            "0": /\d/,
            "9": /\d|\s/,
            "#": /\d|\s|\+|\-/,
            "L": /[a-zA-Z]/,
            "?": /[a-zA-Z]|\s/,
            "&": /\S/,
            "C": /./,
            "A": /[a-zA-Z0-9]/,
            "a": /[a-zA-Z0-9]|\s/
        },

        setOptions: function(options) {
            var that = this;

            Widget.fn.setOptions.call(that, options);

            that._rules = $.extend({}, that.rules, that.options.rules);

            that._tokenize();

            this._unbindInput();
            this._bindInput();

            that.value(that.element.val());
        },

        destroy: function() {
            var that = this;

            that.element.off(ns);

            if (that._form) {
                that._form.off("reset", that._resetHandler);
            }

            Widget.fn.destroy.call(that);
        },

        value: function(value) {
            var element = this.element;
            var emptyMask = this._emptyMask;

            if (value === undefined) {
                return this.element.val();
            }

            if (!emptyMask) {
                element.val(value);
                return;
            }

            value = this._unmask(value + "");

            element.val(value ? emptyMask : "");

            this._mask(0, this._maskLength, value);

            if (kendo._activeElement() !== element && element.val() === emptyMask) {
                element.val("");
            }
        },

        readonly: function(readonly) {
            this._editable({
                readonly: readonly === undefined ? true : readonly,
                disable: false
            });
        },

        enable: function(enable) {
            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined ? true : enable)
            });
        },

        _bindInput: function() {
            var that = this;

            if (that._maskLength) {
                that.element
                    .on("keydown" + ns, proxy(that._keydown, that))
                    .on("keypress" + ns, proxy(that._keypress, that))
                    .on("paste" + ns, proxy(that._paste, that))
                    .on(INPUT_EVENT_NAME, proxy(that._propertyChange, that));
            }
        },

        _unbindInput: function() {
            this.element
                .off("keydown" + ns)
                .off("keypress" + ns)
                .off("paste" + ns)
                .off(INPUT_EVENT_NAME);
        },

        _editable: function(options) {
            var that = this;
            var element = that.element;
            var disable = options.disable;
            var readonly = options.readonly;

            that._unbindInput();

            if (!readonly && !disable) {
                element.removeAttr(DISABLED)
                       .removeAttr(READONLY)
                       .removeClass(STATEDISABLED);

                that._bindInput();
            } else {
                element.attr(DISABLED, disable)
                       .attr(READONLY, readonly)
                       .toggleClass(STATEDISABLED, disable);
            }
        },

        _change: function() {
            var that = this;
            var value = that.value();

            if (value !== that._oldValue) {
                that._oldValue = value;

                that.trigger(CHANGE);
                that.element.trigger(CHANGE);
            }
        },

        _propertyChange: function() {
            var that = this;
            var element = that.element[0];
            var value = element.value;
            var unmasked;
            var start;

            if (value !== that._old && !that._pasting) {
                start = caret(element)[0];
                unmasked = that._unmask(value.substring(start), start);

                element.value = that._old = value.substring(0, start) + that._emptyMask.substring(start);

                that._mask(start, start, unmasked);
                caret(element, start);
            }
        },

        _paste: function(e) {
            var that = this;
            var element = e.target;
            var position = caret(element);
            var start = position[0];
            var end = position[1];

            var unmasked = that._unmask(element.value.substring(end), end);

            that._pasting = true;

            setTimeout(function() {
                var value = element.value;
                var pasted = value.substring(start, caret(element)[0]);

                element.value = that._old = value.substring(0, start) + that._emptyMask.substring(start);

                that._mask(start, start, pasted);

                start = caret(element)[0];

                that._mask(start, start, unmasked);

                caret(element, start);

                that._pasting = false;
            });
        },

        _reset: function() {
            var that = this;
            var element = that.element;
            var formId = element.attr("form");
            var form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    setTimeout(function() {
                        that.value(element[0].value);
                    });
                };

                that._form = form.on("reset", that._resetHandler);
            }
        },

        _keydown: function(e) {
            var key = e.keyCode;
            var element = this.element[0];
            var selection = caret(element);
            var start = selection[0];
            var end = selection[1];
            var placeholder;

            var backward = key === keys.BACKSPACE;

            if (backward || key === keys.DELETE) {
                if (start === end) {
                    if (backward) {
                        start -= 1;
                    } else {
                        end += 1;
                    }

                    placeholder = this._find(start, backward);
                }

                if (placeholder !== undefined && placeholder !== start) {
                    if (backward) {
                        placeholder += 1;
                    }

                    caret(element, placeholder);
                } else if (start > -1) {
                    this._mask(start, end, "", backward);
                }

                e.preventDefault();
            } else if (key === keys.ENTER) {
                this._change();
                e.preventDefault();
            }
        },

        _keypress: function(e) {
            if (e.which === 0) {
                return;
            }

            var selection = caret(this.element);

            this._mask(selection[0], selection[1], String.fromCharCode(e.which));

            e.preventDefault();
        },

        _find: function(idx, backward) {
            var value = this.element.val() || this._emptyMask;
            var step = 1;

            if (backward === true) {
                step = -1;
            }

            while (idx > -1 || idx <= this._maskLength) {
                if (value.charAt(idx) !== this.tokens[idx]) {
                    return idx;
                }

                idx += step;
            }

            return -1;
        },

        _mask: function(start, end, value, backward) {
            var element = this.element[0];
            var current = element.value || this._emptyMask;
            var empty = this.options.promptChar;
            var valueLength;
            var charIdx = 0;
            var unmasked;
            var char;
            var idx;

            start = this._find(start, backward);

            if (start > end) {
                end = start;
            }

            unmasked = this._unmask(current.substring(end), end);
            value = this._unmask(value, start);
            valueLength = value.length;

            if (value) {
                unmasked = unmasked.replace(new RegExp("^_{0," + valueLength + "}"), "");
            }

            value += unmasked;
            current = current.split("");
            char = value.charAt(charIdx);

            while (start < this._maskLength) {
                current[start] = char || empty;
                char = value.charAt(++charIdx);

                if (idx === undefined && charIdx > valueLength) {
                    idx = start;
                }

                start = this._find(start + 1);
            }

            element.value = this._old = current.join("");

            if (kendo._activeElement() === element) {
                if (idx === undefined) {
                    idx = this._maskLength;
                }

                caret(element, idx);
            }
        },

        _unmask: function(value, idx) {
            if (!value) {
                return "";
            }

            value = (value + "").split("");

            var char;
            var token;
            var charIdx = 0;
            var tokenIdx = idx || 0;

            var empty = this.options.promptChar;

            var valueLength = value.length;
            var tokensLength = this.tokens.length;

            var result = "";

            while (tokenIdx < tokensLength) {
                char = value[charIdx];
                token = this.tokens[tokenIdx];

                if (char === token || char === empty) {
                    result += char === empty ? empty : "";

                    charIdx += 1;
                    tokenIdx += 1;
                } else if (typeof token !== "string") {
                    if ((token.test && token.test(char)) || ($.isFunction(token) && token(char))) {
                        result += char;
                        tokenIdx += 1;
                    }

                    charIdx += 1;
                } else {
                    tokenIdx += 1;
                }

                if (charIdx >= valueLength) {
                    break;
                }
            }

            return result;
        },

        _tokenize: function() {
            var tokens = [];
            var tokenIdx = 0;

            var mask = this.options.mask || "";
            var maskChars = mask.split("");
            var length = maskChars.length;
            var idx = 0;
            var char;
            var rule;

            var emptyMask = "";
            var promptChar = this.options.promptChar;
            var numberFormat = kendo.getCulture(this.options.culture).numberFormat;
            var rules = this._rules;

            for (; idx < length; idx++) {
                char = maskChars[idx];
                rule = rules[char];

                if (rule) {
                    tokens[tokenIdx] = rule;
                    emptyMask += promptChar;
                    tokenIdx += 1;
                } else {
                    if (char === "." || char === ",") {
                        char = numberFormat[char];
                    } else if (char === "$") {
                        char = numberFormat.currency.symbol;
                    } else if (char === "\\") {
                        idx += 1;
                        char = maskChars[idx];
                    }

                    char = char.split("");

                    for (var i = 0, l = char.length; i < l; i++) {
                        tokens[tokenIdx] = char[i];
                        emptyMask += char[i];
                        tokenIdx += 1;
                    }
                }
            }

            this.tokens = tokens;

            this._emptyMask = emptyMask;
            this._maskLength = emptyMask.length;
        }
    });

    ui.plugin(MaskedTextBox);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });