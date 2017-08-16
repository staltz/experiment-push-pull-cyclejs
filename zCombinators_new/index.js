"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_new_1 = require("../../xstream_new");
function sampleCombine() {
    var signals = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        signals[_i] = arguments[_i];
    }
    return function (stream) { return xstream_new_1.create(function (observer) {
        stream.subscribe({
            next: function (t) { return observer.next([t].concat(signals.map(function (s) { return s.next().value; }))); },
            error: observer.error,
            complete: observer.complete
        });
    }); };
}
exports.sampleCombine = sampleCombine;
//# sourceMappingURL=index.js.map