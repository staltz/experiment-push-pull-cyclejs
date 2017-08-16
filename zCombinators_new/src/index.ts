import xs, { IStream, Transformer } from '../../xstream_new';
import ys, { ISignal, Signal } from '../../ysignal_new';

export function sampleCombine<T>(...signals: ISignal<any>[]): Transformer<T, any[]> {
    return stream => xs.create<any[]>(observer => {
        stream.subscribe({
            next: t => observer.next([t].concat(signals.map(s => s.next().value))),
            error: observer.error,
            complete: observer.complete
        });
    });
}

export function startWith<T>(value: T): (s: IStream<T>) => Signal<T> {
    return stream => {
        let currentValue: T = value;
        stream.subscribe({
            next: t => {
                currentValue = t;
            },
            error: () => {},
            complete: () => {}
        });
        return ys.create<T>({
            next(): IteratorResult<T> {
                return { value: currentValue, done: false };
            }
        })
    };
}
