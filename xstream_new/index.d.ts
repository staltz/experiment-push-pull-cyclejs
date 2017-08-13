export declare type IO = void;
export interface Observer<T> {
    next(t: T): IO;
    error(err: any): IO;
    complete(): IO;
}
export interface IStream<T> {
    subscribe(o: Observer<T>): IO;
}
export declare function create<T>(subscribe: (o: Observer<T>) => IO): Stream<T>;
export declare function fromArray<T>(array: T[]): Stream<T>;
export declare function fromPromise<T>(promise: Promise<T>): Stream<T>;
export declare type Transformer<T, U> = (s: IStream<T>) => Stream<U>;
export declare function map<T, U>(fn: (t: T) => U): Transformer<T, U>;
export declare function foldStream<T, U>(fn: (acc: U, curr: T) => U, seed: U): Transformer<T, U>;
export declare class Stream<T> implements IStream<T> {
    subscribe: (o: Observer<T>) => IO;
    constructor(subscribe: (o: Observer<T>) => IO);
    compose<U>(fn: Transformer<T, U>): Stream<U>;
    map<U>(fn: (t: T) => U): Stream<U>;
    fold<U>(fn: (acc: U, curr: T) => U, seed: U): Stream<U>;
}
declare const _default: {
    create: <T>(subscribe: (o: Observer<T>) => void) => Stream<T>;
    fromArray: <T>(array: T[]) => Stream<T>;
    fromPromise: <T>(promise: Promise<T>) => Stream<T>;
};
export default _default;
