import { Transformer, create } from './index';

export function constantAfter<T>(amount: number): Transformer<T, T> {
    return signal => {
        let currentIteration = 1;
        let result: any = undefined;
        return create<T>({
            next(): IteratorResult<T> {
                if(currentIteration <= amount) {
                    currentIteration++;
                    if(currentIteration === amount) {
                        result = signal.next();
                    } else {
                        return signal.next();
                    }
                }
                return result;
            }
        });
    };
}
