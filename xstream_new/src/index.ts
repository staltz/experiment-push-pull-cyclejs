import $$observable from 'symbol-observable';

export type IO = void;

export interface Observer<T> {
    next(t: T): IO;
    error(err: any): IO;
    complete(): IO;
};

export interface IStream<T> {
    subscribe(o: Observer<T>): IO;
}

//+++++++++++++++++++++++ Stream creators +++++++++++++++++++++++++++//
export function create<T>(subscribe: (o: Observer<T>) => IO): Stream<T> {
    return new Stream<T>(subscribe);
}

export function fromArray<T>(array: T[]): Stream<T> {
    return create<T>(observer => {
        array.forEach(a => observer.next(a));
    });
}

export function fromPromise<T>(promise: Promise<T>): Stream<T> {
    return create<T>(observer => {
        promise.then(val => observer.next(val));
    });
}

//+++++++++++++++++++++++ Stream transformers +++++++++++++++++++++++//
export type Transformer<T, U> = (s: IStream<T>) => Stream<U>;

export function map<T, U>(fn: (t: T) => U) : Transformer<T, U> {
    return stream => create<U>(observer => {
        stream.subscribe({
            next: t => observer.next(fn(t)),
            error: observer.error,
            complete: observer.complete
        })
    });
}

export function foldStream<T, U>(fn: (acc: U, curr: T) => U, seed: U): Transformer<T, U> {
    return stream => create<U>(observer => {
        let accumulator = seed;
        stream.subscribe({
            next: t => {
                accumulator = fn(accumulator, t);
                observer.next(accumulator);
            },
            error: observer.error,
            complete: observer.complete
        });
    });
}

//+++++ Implementation of basic interfaces with helper functions ++++//
export class Stream<T> implements IStream<T> {
    constructor(public subscribe: (o: Observer<T>) => IO) {}

    [$$observable](): Stream<T> {
        return this;
    }

    public compose<U>(fn: Transformer<T, U>): Stream<U> {
        return fn(this);
    }

    public map<U>(fn: (t: T) => U): Stream<U> {
        return this.compose(map(fn));
    }
    public fold<U>(fn: (acc: U, curr: T) => U, seed: U): Stream<U> {
        return this.compose(foldStream(fn, seed));
    }
}

export default {
    create,
    fromArray,
    fromPromise
};
