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

export function of<T>(...items: T[]): Stream<T> {
    return fromArray<T>(items);
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

export function mapTo<T>(value: T): Transformer<any, T> {
    return map<any, T>(() => value);
}

export function fold<T, U>(fn: (acc: U, curr: T) => U, seed: U): Transformer<T, U> {
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

export function filter<T>(predicate: (t: T) => boolean): Transformer<T, T> {
    return stream => create<T>(observer => {
        stream.subscribe({
            next: t => {
                if(predicate(t)) {
                    observer.next(t);
                }
            },
            error: observer.error,
            complete: observer.complete
        });
    });
}

export function take<T>(amount: number): Transformer<T, T> {
    return stream => create<T>(observer => {
        let numPassed = 0;
        stream.subscribe({
            next: t => {
                if(numPassed < amount) {
                    numPassed++;
                    observer.next(t);
                }
                if(numPassed === amount) {
                    numPassed++;
                    observer.complete();
                }
            },
            error: observer.error,
            complete: () => {
                if(numPassed < amount) {
                    observer.complete();
                }
            }
        });
    });
}

export function drop<T>(amount: number): Transformer<T, T> {
    return stream => create<T>(observer => {
        let numDropped = 0;
        stream.subscribe({
            next: t => {
                if(numDropped < amount) {
                    numDropped++;
                } else {
                    observer.next(t);
                }
            },
            error: observer.error,
            complete: observer.complete
        });
    });
}

export function last<T>(): Transformer<T, T | undefined> {
    return stream => create<T | undefined>(observer => {
        let lastValue: T | undefined = undefined;
        stream.subscribe({
            next: t => {
                lastValue = t;
            },
            error: observer.error,
            complete: () => {
                observer.next(lastValue);
                observer.complete();
            }
        });
    });
}

export function endWhen<T>(end: IStream<any>): Transformer<T, T> {
    return stream => create<T>(observer => {
        let completed = false;
        stream.subscribe({
            next: t => {
                if(!completed) {
                    observer.next(t);
                }
            },
            error: observer.error,
            complete: () => {
                if(!completed) {
                    completed = true;
                    observer.complete();
                }
            }
        });
        end.subscribe({
            next: () => {
                completed = true;
                observer.complete();
            },
            error: () => {},
            complete: () => {}
        });
    });
}

export function flatten<T>(): Transformer<IStream<T>, T> {
    return stream$ => create<T>(observer => {
        let currentStream = undefined;
        stream$.subscribe({
            next: t => {
                currentStream = t;
                currentStream.subscribe({
                    next: observer.next,
                    error: observer.error,
                    complete: () => {}
                });
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
        return this.compose(map<T, U>(fn));
    }
    public mapTo<U>(value: U): Stream<U> {
        return this.compose(mapTo<U>(value));
    }
    public fold<U>(fn: (acc: U, curr: T) => U, seed: U): Stream<U> {
        return this.compose(fold<T, U>(fn, seed));
    }
    public filter(predicate: (t: T) => boolean): Stream<T> {
        return this.compose(filter<T>(predicate));
    }
    public take(amount: number): Stream<T> {
        return this.compose(take<T>(amount));
    }
    public drop(amount: number): Stream<T> {
        return this.compose(drop<T>(amount));
    }
    public last(): Stream<T | undefined> {
        return this.compose(last<T>());
    }
    public endWhen(end: IStream<any>): Stream<T> {
        return this.compose(endWhen<T>(end));
    }
    public flatten<U>(): Stream<U> {
        return this.compose(flatten<U>() as any);
    }
}

export default {
    create,
    of,
    never,
    empty,
    fromArray,
    fromPromise,
    fromObservable,
    from,
    merge,
    combine
};
