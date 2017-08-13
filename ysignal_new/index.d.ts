export declare type Getter<T> = () => T;
export interface ISignal<T> {
    next(): IteratorResult<T>;
}
export declare function create<T>(iterator: Iterator<T>): Signal<T>;
export declare function fromGetter<T>(getter: Getter<T>): Signal<T>;
export declare function constant<T>(val: T): Signal<T>;
export declare function combine(...signals: ISignal<any>[]): Signal<any[]>;
export declare type SignalTransformer<T, U> = (s: ISignal<T>) => Signal<U>;
export declare function map<T, U>(fn: (t: T) => U): SignalTransformer<T, U>;
export declare function fold<T, U>(fn: (acc: U, curr: T) => U, seed: U): SignalTransformer<T, U>;
export declare function drop<T>(amount: number): SignalTransformer<T, T>;
export declare class Signal<T> implements ISignal<T>, IterableIterator<T> {
    private source;
    constructor(source: Iterator<T>);
    [Symbol.iterator](): IterableIterator<T>;
    next(): IteratorResult<T>;
    compose<U>(fn: SignalTransformer<T, U>): Signal<U>;
    map<U>(fn: (t: T) => U): Signal<U>;
    fold<U>(fn: (acc: U, curr: T) => U, seed: U): Signal<U>;
    drop(amount: number): Signal<T>;
}
declare const _default: {
    create: <T>(iterator: Iterator<T>) => Signal<T>;
    combine: (...signals: ISignal<any>[]) => Signal<any[]>;
    constant: <T>(val: T) => Signal<T>;
    fromGetter: <T>(getter: Getter<T>) => Signal<T>;
};
export default _default;
