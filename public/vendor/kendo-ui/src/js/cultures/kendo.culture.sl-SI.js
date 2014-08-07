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
    define([], f);
})(function(){

(function( window, undefined ) {
    var kendo = window.kendo || (window.kendo = { cultures: {} });
    kendo.cultures["sl-SI"] = {
        name: "sl-SI",
        numberFormat: {
            pattern: ["-n"],
            decimals: 2,
            ",": ".",
            ".": ",",
            groupSize: [3],
            percent: {
                pattern: ["-n%","n%"],
                decimals: 2,
                ",": ".",
                ".": ",",
                groupSize: [3],
                symbol: "%"
            },
            currency: {
                pattern: ["-n $","n $"],
                decimals: 2,
                ",": ".",
                ".": ",",
                groupSize: [3],
                symbol: "€"
            }
        },
        calendars: {
            standard: {
                days: {
                    names: ["nedelja","ponedeljek","torek","sreda","četrtek","petek","sobota"],
                    namesAbbr: ["ned","pon","tor","sre","čet","pet","sob"],
                    namesShort: ["ne","po","to","sr","če","pe","so"]
                },
                months: {
                    names: ["januar","februar","marec","april","maj","junij","julij","avgust","september","oktober","november","december",""],
                    namesAbbr: ["jan","feb","mar","apr","maj","jun","jul","avg","sep","okt","nov","dec",""]
                },
                AM: [""],
                PM: [""],
                patterns: {
                    d: "d.M.yyyy",
                    D: "d. MMMM yyyy",
                    F: "d. MMMM yyyy H:mm:ss",
                    g: "d.M.yyyy H:mm",
                    G: "d.M.yyyy H:mm:ss",
                    m: "d. MMMM",
                    M: "d. MMMM",
                    s: "yyyy'-'MM'-'dd'T'HH':'mm':'ss",
                    t: "H:mm",
                    T: "H:mm:ss",
                    u: "yyyy'-'MM'-'dd HH':'mm':'ss'Z'",
                    y: "MMMM yyyy",
                    Y: "MMMM yyyy"
                },
                "/": ".",
                ":": ":",
                firstDay: 1
            }
        }
    }
})(this);


return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });