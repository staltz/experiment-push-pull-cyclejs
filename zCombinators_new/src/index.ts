import { IStream, Transformer, create } from '../../xstream_new';
import { ISignal } from '../../ysignal_new';

export function sampleCombine<T>(...signals: ISignal<any>[]): Transformer<T, any[]> {
    return stream => create<any[]>(observer => {
        stream.subscribe({
            next: t => observer.next([t].concat(signals.map(s => s.next().value))),
            error: observer.error,
            complete: observer.complete
        });
    });
}
