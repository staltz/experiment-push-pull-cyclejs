import $$observable from 'symbol-observable';

export type IO = any;

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
        observer.complete();
    });
}

export function fromPromise<T>(promise: Promise<T>): Stream<T> {
    return create<T>(observer => {
        promise.then(val => {
            observer.next(val);
            observer.complete();
        });
    });
}

export function fromObservable<T>(observable: IStream<T>): Stream<T> {
    return create<T>(observer => {
        observable.subscribe(observer);
    });
}

export function from<T>(input: T[] | Promise<T> | IStream<T>): Stream<T> {
    if (typeof input[$$observable] === 'function') {
        return fromObservable<T>(input as IStream<T>);
    } else if (typeof (input as Promise<T>).then === 'function') {
        return fromPromise<T>(input as Promise<T>);
    } else if (Array.isArray(input)) {
        return fromArray<T>(input);
    }

    throw new TypeError(
      `Type of input to from() must be an Array, Promise, or Observable`
    );
}

export function never<T>(): Stream<T> {
    return create<T>(() => {});
}

export function empty<T>(): Stream<T> {
    return create<T>(observer => {
        observer.complete();
    });
}

export function merge(...streams: Stream<any>[]): Stream<any> {
    return create<any>(observer => {
        let numComplete = 0;
        streams.forEach(s => {
            s.subscribe({
                next: observer.next,
                error: observer.error,
                complete: () => {
                    numComplete++;
                    if(numComplete === streams.length) {
                        observer.complete();
                    }
                }
            });
        });
    });
}

export function combine(...streams: Stream<any>[]): Stream<any[]> {
    return create<any>(observer => {
        let emitted = streams.map(() => false);
        let lastValues = streams.map(() => undefined);
        let numComplete = 0;
        streams.forEach((s, i) => {
            s.subscribe({
                next: t => {
                    emitted[i] = true;
                    lastValues[i] = t;
                    if(emitted.reduce((acc, curr) => acc && curr, true)) {
                        observer.next(lastValues);
                    }
                },
                error: observer.error,
                complete: () => {
                    numComplete++;
                    if(numComplete === streams.length) {
                        observer.complete();
                    }
                }
            });
        });
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
export class Stream<T> implements IStream<T>, Observable {
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
    fromPromise,
    merge,
    combine
};
