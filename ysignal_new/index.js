"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An infinte iteratable that is used to represent values over time
 */
var Signal = (function () {
    function Signal(source) {
        this.source = source;
        //+++++++++++++++ short-hand functions +++++++++++++++++++//
        this.constantAfter = constantAfter.bind(null, this);
        this.map = map.bind(null, this);
        this.fold = fold.bind(null, this);
        this.drop = drop.bind(null, this);
    }
    //+++++++++++++ iterator interface +++++++++++++++++++++//
    Signal.prototype[Symbol.iterator] = function () {
        return this;
    };
    Signal.prototype.next = function () {
        return this.source.next();
    };
    Signal.prototype.compose = function (transform) {
        return transform(this);
    };
    return Signal;
}());
exports.Signal = Signal;
//++++++++++++ creators ++++++++++++++++++++++++++++++//
function create(iterator) {
    return new Signal(iterator);
}
exports.create = create;
function from(getter) {
    return create({
        next: function () {
            return { value: getter(), done: false };
        }
    });
}
exports.from = from;
function constant(val) {
    return from(function () { return val; });
}
exports.constant = constant;
//+++++++++++++ transformers +++++++++++++++++++++++//
function constantAfter(signal, amount) {
    var currentIteration = 1;
    var result = undefined;
    return create({
        next: function () {
            if (currentIteration < amount) {
                currentIteration++;
                return signal.next();
            }
            if (currentIteration === amount) {
                result = signal.next();
            }
            return result;
        }
    });
}
exports.constantAfter = constantAfter;
function map(signal, fn) {
    return create({
        next: function () {
            return { value: fn(signal.next().value), done: false };
        }
    });
}
exports.map = map;
function fold(signal, fn, seed) {
    var accumulator = seed;
    return create({
        next: function () {
            accumulator = fn(accumulator, signal.next().value);
            return { value: accumulator, done: false };
        }
    });
}
exports.fold = fold;
function drop(signal, amount) {
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
}
exports.drop = drop;
//+++++++++++++ combinators +++++++++++++++++++++++//
function combine() {
    var signals = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        signals[_i] = arguments[_i];
    }
    return create({
        next: function () {
            var nextValues = signals.map(function (s) { return s.next().value; });
            return { value: nextValues, done: false };
        }
    });
}
exports.combine = combine;
//# sourceMappingURL=index.js.map