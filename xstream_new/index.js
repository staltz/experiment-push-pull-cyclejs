"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var symbol_observable_1 = require("symbol-observable");
;
//+++++++++++++++++++++++ Stream creators +++++++++++++++++++++++++++//
function create(subscribe) {
    return new Stream(subscribe);
}
exports.create = create;
function fromArray(array) {
    return create(function (observer) {
        array.forEach(function (a) { return observer.next(a); });
    });
}
exports.fromArray = fromArray;
function fromPromise(promise) {
    return create(function (observer) {
        promise.then(function (val) { return observer.next(val); });
    });
}
exports.fromPromise = fromPromise;
function map(fn) {
    return function (stream) { return create(function (observer) {
        stream.subscribe({
            next: function (t) { return observer.next(fn(t)); },
            error: observer.error,
            complete: observer.complete
        });
    }); };
}
exports.map = map;
function foldStream(fn, seed) {
    return function (stream) { return create(function (observer) {
        var accumulator = seed;
        stream.subscribe({
            next: function (t) {
                accumulator = fn(accumulator, t);
                observer.next(accumulator);
            },
            error: observer.error,
            complete: observer.complete
        });
    }); };
}
exports.foldStream = foldStream;
//+++++ Implementation of basic interfaces with helper functions ++++//
var Stream = (function () {
    function Stream(subscribe) {
        this.subscribe = subscribe;
    }
    Stream.prototype[symbol_observable_1.default] = function () {
        return this;
    };
    Stream.prototype.compose = function (fn) {
        return fn(this);
    };
    Stream.prototype.map = function (fn) {
        return this.compose(map(fn));
    };
    Stream.prototype.fold = function (fn, seed) {
        return this.compose(foldStream(fn, seed));
    };
    return Stream;
}());
exports.Stream = Stream;
exports.default = {
    create: create,
    fromArray: fromArray,
    fromPromise: fromPromise
};
//# sourceMappingURL=index.js.map