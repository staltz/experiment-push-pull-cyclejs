export declare type Getter<T> = () => T;
export interface Observer<T> {
    next(t: T): void;
    error(err: any): void;
    complete(): void;
}
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
export declare abstract class BaseSource<T> {
    abstract subscribe(o: Observer<T>): void;
    compose<U>(fn: (s: BaseSource<T>) => Stream<U>): Stream<U>;
    map<U>(fn: (t: T) => U): Stream<U>;
    fold<U>(fn: (acc: U, curr: T) => U, seed: U): Stream<U>;
    sampleCombine(...signals: Signal<any>[]): Stream<any[]>;
}
export declare class ArraySource<T> extends BaseSource<T> {
    private array;
    constructor(array: T[]);
    subscribe(observer: Observer<T>): void;
}
export declare class PromiseSource<T> extends BaseSource<T> {
    private promise;
    constructor(promise: Promise<T>);
    subscribe(observer: Observer<T>): void;
}
export declare class Stream<T> extends BaseSource<T> {
    private _subscribe;
    constructor(_subscribe: (o: Observer<T>) => void);
    subscribe(o: Observer<T>): void;
}
export declare function mapStream<T, U>(fn: (t: T) => U): (s: Stream<T>) => Stream<U>;
export declare function foldStream<T, U>(fn: (acc: U, curr: T) => U, seed: U): (s: Stream<T>) => Stream<U>;
export declare function sampleCombine<T>(...signals: Signal<any>[]): (s: Stream<T>) => Stream<any[]>;
export declare function createSignal<T>(iterator: Iterator<T>): Signal<T>;
export declare function fromGetter<T>(getter: Getter<T>): Signal<T>;
export declare function constant<T>(val: T): Signal<T>;
export declare function constantAfter<T>(signal: Signal<T>, amount: number): Signal<T>;
export declare function map<T, U>(signal: Signal<T>, fn: (t: T) => U): Signal<U>;
export declare function fold<T, U>(signal: Signal<T>, fn: (acc: U, curr: T) => U, seed: U): Signal<U>;
export declare function drop<T>(signal: Signal<T>, amount: number): Signal<T>;
export declare function combine(...signals: Signal<any>[]): Signal<any[]>;
