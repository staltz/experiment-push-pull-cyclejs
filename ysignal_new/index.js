"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//+++++++++++++++++++++++++ Signal Creators +++++++++++++++++++++++++//
function create(iterator) {
    return new Signal(iterator);
}
exports.create = create;
function fromGetter(getter) {
    return create({
        next: function () {
            return { value: getter(), done: false };
        }
    });
}
exports.fromGetter = fromGetter;
function constant(val) {
    return fromGetter(function () { return val; });
}
exports.constant = constant;
function combine() {
    var signals = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        signals[_i] = arguments[_i];
    }
    return create({
        next: function () {
            return { value: signals.map(function (s) { return s.next().value; }), done: false };
        }
    });
}
exports.combine = combine;
function map(fn) {
    return function (signal) { return create({
        next: function () {
            return { value: fn(signal.next().value), done: false };
        }
    }); };
}
exports.map = map;
function fold(fn, seed) {
    return function (signal) {
        var accumulator = seed;
        return create({
            next: function () {
                accumulator = fn(accumulator, signal.next().value);
                return { value: accumulator, done: false };
            }
        });
    };
}
exports.fold = fold;
function drop(amount) {
    return function (signal) {
        var dropped = false;
        return create({
            next: function () {
                if (!dropped) {
                    for (var i = 0; i < amount; i++) {
                        signal.next();
                    }
                    dropped = true;
                }
                return signal.next();
            }
        });
    };
}
exports.drop = drop;
//++++ Implementation of basic interfaces with helper functions +++++//
var Signal = (function () {
    function Signal(source) {
        this.source = source;
    }
    Signal.prototype[Symbol.iterator] = function () {
        return this;
    };
    Signal.prototype.next = function () {
        return this.source.next();
    };
    Signal.prototype.compose = function (fn) {
        return fn(this);
    };
    Signal.prototype.map = function (fn) {
        return this.compose(map(fn));
    };
    Signal.prototype.fold = function (fn, seed) {
        return this.compose(fold(fn, seed));
    };
    Signal.prototype.drop = function (amount) {
        return this.compose(drop(amount));
    };
    return Signal;
}());
exports.Signal = Signal;
exports.default = {
    create: create,
    combine: combine,
    constant: constant,
    fromGetter: fromGetter
};
//# sourceMappingURL=index.js.map