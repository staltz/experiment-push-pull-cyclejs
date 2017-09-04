import {CombineSignature} from './signatures';

export type Getter<T> = () => T;
export type UpdateCountIteratorResult<T> = IteratorResult<T> & {count: number};

//+++++++++++++++++ Signal creators +++++++++++++++++++++++++++++++++++++//
export function create<T>(iterable: Iterable<T>): Signal<T> {
  return new Signal<T>(iterable);
}

export function from<T>(getter: Getter<T>): Signal<T> {
  return create<T>({
    [Symbol.iterator](): Iterator<T> {
      let last: any = undefined;
      let count = 0;
      return {
        next(): UpdateCountIteratorResult<T> {
          let current = getter();
          if(current !== last) {
            count++;
          }
          last = current;
          return { value: current, done: false, count };
        }
      };
    }
  });
}

export function constant<T>(val: T): Signal<T> {
  return from<T>(() => val);
}

export const combine: CombineSignature = function combine(
  ...signals: Array<Signal<any>>
): Signal<any[]> {
  return create<any[]>({
    [Symbol.iterator](): Iterator<any[]> {
      const inIters = signals.map(ins => ins.init());
      let lastInIterCounts: number[] = signals.map(_ => -1);
      let lasts: any[] = signals.map(_ => undefined);
      let count = 0;
      return {
        next(): UpdateCountIteratorResult<any[]> {
          inIters.forEach((iter, i) => {
            const t = iter.next() as UpdateCountIteratorResult<any>;
            if(lastInIterCounts[i] !== t.count && !t.done) {
              count++;
              lasts[i] = t.value;
              lastInIterCounts[i] = t.count;
            }
          });
          return { value: lasts, done: false, count };
        }
      }
    }
  });
} as CombineSignature

export function startWith<T>(seed: T): (s: any) => Signal<T> {
  return stream => create<T>({
    [Symbol.iterator](): Iterator<T> {
      let value = seed;
      const subscription = stream.subscribe({
        next: (t: T) => {
          value = t;
        }
      });
      let lastValue: any = undefined;
      let count = 0;
      let last: UpdateCountIteratorResult<T> = { value, done: false, count } as any;
      return {
        next(): UpdateCountIteratorResult<T> {
          if (lastValue !== value) {
            count++;
            last = { value , done: false, count };
            lastValue = value;
          }
          return last;
        }
      };
    }
  });
}

//+++++++++++++++++ Signal transformer +++++++++++++++++++++++++++++++++++//
export type Transformer<T, R> = (s: Signal<T>) => Signal<R>;

export function map<T, R>(project: (x: T) => R): Transformer<T, R> {
  return ins => create<R>({
    [Symbol.iterator](): Iterator<R> {
      const inIter = ins.init();
      let lastInIterCount: number = -1;
      let count = 0;
      let last: UpdateCountIteratorResult<R> = { value: undefined, done: false, count } as any;
      return {
        next(): UpdateCountIteratorResult<R> {
          if(last.done) { return last; }
          const t = inIter.next() as UpdateCountIteratorResult<T>;
          if(t.done) {
            count++;
            last = { value: undefined, done: true } as any;
          }
          else if (lastInIterCount !== t.count) {
            count++;
            console.log("Update");
            last = { value: project(t.value), done: false, count };
            lastInIterCount = t.count;
          }
          return last;
        }
      };
    }
  });
}

export function fold<T, R>(project: (acc: R, x: T) => R, seed: R): Transformer<T, R> {
  return ins => create<R>({
    [Symbol.iterator](): Iterator<R> {
      const inIter = ins.init();
      let lastInIterCount: number = -1;
      let count = 0;
      let last: UpdateCountIteratorResult<R> = { value: undefined, done: false, count } as any;
      return {
        next(): UpdateCountIteratorResult<R> {
          if (last.done) { return last; }
          if(last.value === undefined) {
            last = { value: seed, done: false, count };
          }
          else {
            const t = inIter.next() as UpdateCountIteratorResult<T>;
            if(t.done) {
              last = { value: undefined, done: true } as any;
            }
            else if (lastInIterCount !== t.count) {
              count++;
              last = { value: project(last.value, t.value), done: false, count };
              lastInIterCount = t.count;
            }
          }
          return last;
        }
      };
    }
  });
}

export function drop<T>(amount: number): Transformer<T, T> {
  return ins => create<T>({
    [Symbol.iterator](): Iterator<T> {
      const inIter = ins.init();
      let dropped = false;
      return {
        next(): UpdateCountIteratorResult<T> {
          if(!dropped) {
            for(let i = 0; i < amount; i++) {
              inIter.next();
            }
            dropped = true;
          }
          return inIter.next() as UpdateCountIteratorResult<T>;
        }
      }
    }
  });
}

// function take<T>(amount: number): Transformer<T,T> {
// }

export class Signal<T> implements Iterable<T> {
  private iterator: Iterator<T> | null = null;

  constructor(private iterable: Iterable<T>) {}

  public [Symbol.iterator](): Iterator<T> {
    return this.init();
  }

  public init(): Iterator<T> {
    if (!this.iterator) {
      this.iterator = this.iterable[Symbol.iterator]();
    }
    return this.iterator;
  }

  public compose<U>(operator: Transformer<T, U>): Signal<U> {
    return operator(this);
  }

  public map<R>(project: (t: T) => R): Signal<R> {
    return this.compose(map<T, R>(project));
  }

  public fold<R>(project: (acc: R, t: T) => R, seed: R): Signal<R> {
    return this.compose(fold<T, R>(project, seed));
  }

  public drop(amount: number): Signal<T> {
    return this.compose(drop<T>(amount));
  }
}

export default {
  create,
  from,
  constant,
  combine
};
