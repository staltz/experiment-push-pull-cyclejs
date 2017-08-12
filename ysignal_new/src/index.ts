import $$observable from 'symbol-observable';

export type Getter<T> = () => T;

export interface Observer<T> {
    next(t: T): void;
    error(err: any): void;
    complete(): void;
};

/**
 * An infinte iteratable that is used to represent values over time
 */
export class Signal<T> implements IterableIterator<T> {
    constructor(private source: Iterator<T>) {}

    //+++++++++++++ iterator interface +++++++++++++++++++++//
    public [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

    public next(): IteratorResult<T> {
        return this.source.next();
    }

    //+++++++++++++++ short-hand functions +++++++++++++++++++//
    public constantAfter: (amount: number) => Signal<T> = constantAfter.bind(null, this);
    public map: <U>(fn: (t: T) => U) => Signal<U> = map.bind(null, this);
    public fold: <U>(fn: (acc: U, curr: T) => U, seed: U) => Signal<U> = fold.bind(null, this);
    public drop: (amount: number) => Signal<T> = drop.bind(null, this);

    public compose<U>(transform: (s: Signal<T>) => Signal<U>): Signal<U> {
        return transform(this);
    }
}

export interface Source<T> {
    subscribe(o: Observer<T>): any;
}

export class BaseSource<T> {
    public map: <U>(fn: (t: T) => U) => Stream<U> = mapStream.bind(null, this);
    public fold: <U>(fn: (acc: U, curr: T) => U, seed: U) => Stream<U> = foldStream.bind(null, this);
}

export class ArraySource<T> extends BaseSource<T> implements Source<T> {
    constructor(private array: T[]) {
        super();
    }

    public subscribe(observer: Observer<T>): any {
        this.array.forEach(t => observer.next(t));
    }
}

export class Stream<T> extends BaseSource<T> implements Source<T> {

    constructor(public subscribe: (o: Observer<T>) => void) {
        super();
    }

    [$$observable](): Stream<T> {
        return this as any as Stream<T>;
    }
}

export interface Helpers<T> {
    map<U>(fn: (t: T) => U): Stream<U>;
    fold<U>(fn: (acc: U, curr: T) => U, seed: U): Stream<U>;
}

//++++++++++++++++++ streamOperators ++++++++++++++++++++++++++++//
export function mapStream<T, U>(stream: Stream<T>, fn: (t: T) => U): Stream<U> {
    return new Stream(observer => {
        stream.subscribe({
            next: t => observer.next(fn(t)),
            error: observer.error,
            complete: observer.complete
        });
    });
}

export function foldStream<T, U>(stream: Stream<T>, fn: (acc: U, curr: T) => U, seed: U): Stream<U> {
    return new Stream(observer => {
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

//++++++++++++ creators ++++++++++++++++++++++++++++++//
export function createSignal<T>(iterator: Iterator<T>): Signal<T> {
    return new Signal<T>(iterator);
}

export function fromGetter<T>(getter: Getter<T>): Signal<T> {
    return createSignal<T>({
        next(): IteratorResult<T> {
            return {value: getter(), done: false};
        }
    });
}

export function constant<T>(val: T): Signal<T> {
    return fromGetter<T>(() => val);
}

//+++++++++++++ transformers +++++++++++++++++++++++//
export function constantAfter<T>(signal: Signal<T>, amount: number): Signal<T> {
    let currentIteration = 1;
    let result: IteratorResult<T> | undefined = undefined;
    return createSignal<T>({
        next(): IteratorResult<T> {
            if(currentIteration < amount) {
                currentIteration++;
                return signal.next();
            }
            if(currentIteration === amount) {
                result = signal.next();
            }
            return result as IteratorResult<T>;
        }
    });
}

export function map<T, U>(signal: Signal<T>, fn: (t: T) => U): Signal<U> {
    return createSignal<U>({
        next(): IteratorResult<U> {
            return { value: fn(signal.next().value), done: false };
        }
    });
}

export function fold<T, U>(signal: Signal<T>, fn: (acc: U, curr: T) => U, seed: U): Signal<U> {
    let accumulator: U = seed;
    return createSignal<U>({
        next(): IteratorResult<U> {
            accumulator = fn(accumulator, signal.next().value);
            return { value: accumulator, done: false };
        }
    });
}

export function drop<T>(signal: Signal<T>, amount: number): Signal<T> {
    let dropped = false;
    return createSignal<T>({
        next(): IteratorResult<T> {
            if(!dropped) {
                for(let i = 0; i < amount; i++) {
                    signal.next();
                }
                dropped = true;
            }
            return signal.next();
        }
    });
}

//+++++++++++++ combinators +++++++++++++++++++++++//
export function combine(...signals: Signal<any>[]): Signal<any[]> {
    return createSignal<any[]>({
        next(): IteratorResult<any[]> {
            const nextValues = signals.map(s => s.next().value);
            return { value: nextValues, done: false };
        }
    });
}
