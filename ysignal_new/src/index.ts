export type Getter<T> = () => T;

export interface ISignal<T> {
    next(): IteratorResult<T>;
}

//+++++++++++++++++++++++++ Signal Creators +++++++++++++++++++++++++//
export function create<T>(iterator: Iterator<T>): Signal<T> {
    return new Signal<T>(iterator);
}

export function fromGetter<T>(getter: Getter<T>): Signal<T> {
    return create<T>({
        next(): IteratorResult<T> {
            return { value: getter(), done: false };
        }
    });
}

export function constant<T>(val: T): Signal<T> {
    return fromGetter<T>(() => val);
}

export function combine(...signals: ISignal<any>[]): Signal<any[]> {
    return create<any[]>({
        next(): IteratorResult<any[]> {
            return { value: signals.map(s => s.next().value), done: false };
        }
    });
}

//++++++++++++++++++++++++ Signal Transformers ++++++++++++++++++++++//
export type Transformer<T, U> = (s: ISignal<T>) => Signal<U>;

export function map<T, U>(fn: (t: T) => U): Transformer<T, U> {
    return signal => create<U>({
        next(): IteratorResult<U> {
            return { value: fn(signal.next().value), done: false };
        }
    });
}

export function fold<T, U>(fn: (acc: U, curr: T) => U, seed: U): Transformer<T, U> {
    return signal => {
        let accumulator: U = seed;
        return create<U>({
            next(): IteratorResult<U> {
                accumulator = fn(accumulator, signal.next().value);
                return { value: accumulator, done: false };
            }
        });
    };
}

export function drop<T>(amount: number): Transformer<T, T> {
    return signal => {
        let dropped = false;
        return create<T>({
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
    };
}

//++++ Implementation of basic interfaces with helper functions +++++//
export class Signal<T> implements ISignal<T>, IterableIterator<T> {
    constructor(private source: Iterator<T>) {}

    public [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

    public next(): IteratorResult<T> {
        return this.source.next();
    }

    public compose<U>(fn: Transformer<T, U>): Signal<U> {
        return fn(this);
    }

    public map<U>(fn: (t: T) => U): Signal<U> {
        return this.compose(map<T, U>(fn));
    }
    public fold<U>(fn: (acc: U, curr: T) => U, seed: U): Signal<U> {
        return this.compose(fold<T, U>(fn, seed));
    }
    public drop(amount: number): Signal<T> {
        return this.compose(drop<T>(amount));
    }
}

export default {
    create,
    combine,
    constant,
    fromGetter
};
