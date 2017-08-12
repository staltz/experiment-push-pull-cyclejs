export type Getter<T> = () => T;

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

//++++++++++++ creators ++++++++++++++++++++++++++++++//
export function create<T>(iterator: Iterator<T>): Signal<T> {
    return new Signal<T>(iterator);
}

export function from<T>(getter: Getter<T>): Signal<T> {
    return create<T>({
        next(): IteratorResult<T> {
            return {value: getter(), done: false};
        }
    });
}

export function constant<T>(val: T): Signal<T> {
    return from<T>(() => val);
}

//+++++++++++++ transformers +++++++++++++++++++++++//
export function constantAfter<T>(signal: Signal<T>, amount: number): Signal<T> {
    let currentIteration = 1;
    let result: IteratorResult<T> | undefined = undefined;
    return create<T>({
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
    return create<U>({
        next(): IteratorResult<U> {
            return { value: fn(signal.next().value), done: false };
        }
    });
}

export function fold<T, U>(signal: Signal<T>, fn: (acc: U, curr: T) => U, seed: U): Signal<U> {
    let accumulator: U = seed;
    return create<U>({
        next(): IteratorResult<U> {
            accumulator = fn(accumulator, signal.next().value);
            return { value: accumulator, done: false };
        }
    });
}

export function drop<T>(signal: Signal<T>, amount: number): Signal<T> {
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
}

//+++++++++++++ combinators +++++++++++++++++++++++//
export function combine(...signals: Signal<any>[]): Signal<any[]> {
    return create<any[]>({
        next(): IteratorResult<any[]> {
            const nextValues = signals.map(s => s.next().value);
            return { value: nextValues, done: false };
        }
    });
}
