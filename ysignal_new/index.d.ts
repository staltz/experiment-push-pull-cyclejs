export declare type Getter<T> = () => T;
/**
 * An infinte iteratable that is used to represent values over time
 */
export declare class Signal<T> implements IterableIterator<T> {
    private source;
    constructor(source: Iterator<T>);
    [Symbol.iterator](): IterableIterator<T>;
    next(): IteratorResult<T>;
    constantAfter: (amount: number) => Signal<T>;
    map: <U>(fn: (t: T) => U) => Signal<U>;
    fold: <U>(fn: (acc: U, curr: T) => U, seed: U) => Signal<U>;
    drop: (amount: number) => Signal<T>;
    compose<U>(transform: (s: Signal<T>) => Signal<U>): Signal<U>;
}
export declare function create<T>(iterator: Iterator<T>): Signal<T>;
export declare function from<T>(getter: Getter<T>): Signal<T>;
export declare function constant<T>(val: T): Signal<T>;
export declare function constantAfter<T>(signal: Signal<T>, amount: number): Signal<T>;
export declare function map<T, U>(signal: Signal<T>, fn: (t: T) => U): Signal<U>;
export declare function fold<T, U>(signal: Signal<T>, fn: (acc: U, curr: T) => U, seed: U): Signal<U>;
export declare function drop<T>(signal: Signal<T>, amount: number): Signal<T>;
export declare function combine(...signals: Signal<any>[]): Signal<any[]>;
