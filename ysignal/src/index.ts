export type Getter<T> = () => T;

export interface CombineSignature {
  (): Signal<Array<any>>;
  <T1>(s1: Signal<T1>): Signal<[T1]>;
  <T1, T2>(s1: Signal<T1>, s2: Signal<T2>): Signal<[T1, T2]>;
  <T1, T2, T3>(s1: Signal<T1>, s2: Signal<T2>, s3: Signal<T3>): Signal<
    [T1, T2, T3]
  >;
  <T1, T2, T3, T4>(s1: Signal<T1>, s2: Signal<T2>, s3: Signal<T3>, s4: Signal<
    T4
  >): Signal<[T1, T2, T3, T4]>;
  <T1, T2, T3, T4, T5>(s1: Signal<T1>, s2: Signal<T2>, s3: Signal<
    T3
  >, s4: Signal<T4>, s5: Signal<T5>): Signal<[T1, T2, T3, T4, T5]>;
  <T1, T2, T3, T4, T5, T6>(s1: Signal<T1>, s2: Signal<T2>, s3: Signal<
    T3
  >, s4: Signal<T4>, s5: Signal<T5>, s6: Signal<T6>): Signal<
    [T1, T2, T3, T4, T5, T6]
  >;
  <T1, T2, T3, T4, T5, T6, T7>(s1: Signal<T1>, s2: Signal<T2>, s3: Signal<
    T3
  >, s4: Signal<T4>, s5: Signal<T5>, s6: Signal<T6>, s7: Signal<T7>): Signal<
    [T1, T2, T3, T4, T5, T6, T7]
  >;
  <T1, T2, T3, T4, T5, T6, T7, T8>(s1: Signal<T1>, s2: Signal<T2>, s3: Signal<
    T3
  >, s4: Signal<T4>, s5: Signal<T5>, s6: Signal<T6>, s7: Signal<T7>, s8: Signal<
    T8
  >): Signal<[T1, T2, T3, T4, T5, T6, T7, T8]>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9>(s1: Signal<T1>, s2: Signal<
    T2
  >, s3: Signal<T3>, s4: Signal<T4>, s5: Signal<T5>, s6: Signal<T6>, s7: Signal<
    T7
  >, s8: Signal<T8>, s9: Signal<T9>): Signal<
    [T1, T2, T3, T4, T5, T6, T7, T8, T9]
  >;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(s1: Signal<T1>, s2: Signal<
    T2
  >, s3: Signal<T3>, s4: Signal<T4>, s5: Signal<T5>, s6: Signal<T6>, s7: Signal<
    T7
  >, s8: Signal<T8>, s9: Signal<T9>, s10: Signal<T10>): Signal<
    [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]
  >;
  (...signals: Array<Signal<any>>): Signal<Array<any>>;
}

export class Signal<T> implements Iterable<T> {
  constructor(iterable: Iterable<T>) {
    this.iterable = iterable;
    this.iterator = null;
  }

  private iterable: Iterable<T>;
  private iterator: Iterator<T> | null;

  public [Symbol.iterator](): Iterator<T> {
    return this.init();
  }

  public static create<T>(iterable: Iterable<T>): Signal<T> {
    return new Signal<T>(iterable);
  }

  public init(): Iterator<T> {
    if (!this.iterator) {
      this.iterator = this.iterable[Symbol.iterator]();
    }
    return this.iterator;
  }

  public static from<T>(getter: Getter<T>): Signal<T> {
    return Signal.create<T>({
      [Symbol.iterator](): Iterator<T> {
        return {
          next(): IteratorResult<T> {
            return {value: getter(), done: false};
          }
        };
      }
    });
  }

  public static constant<T>(val: T): Signal<T> {
    return Signal.from<T>(() => val);
  }

  public static combine: CombineSignature = function combine(
    ...signals: Array<Signal<any>>
  ) {
    return new Signal<Array<any>>({
      [Symbol.iterator](): Iterator<Array<any>> {
        const iters = signals.map(s => s.init());
        return {
          next(): IteratorResult<Array<any>> {
            const results = iters.map(iter => iter.next());
            if (results.some(r => r.done)) {
              return {done: true, value: undefined as any};
            } else {
              return {done: false, value: results.map(r => r.value)};
            }
          }
        };
      }
    });
  } as CombineSignature;

  // public take(amount: number): Signal<T> {
  // }

  // public sampleCombine<R>(stream: Stream<R>): Stream<[T, R]> {
  //   return stream.map(x => [this._pull(), x] as [T, R]);
  // }

  public map<R>(project: (x: T) => R): Signal<R> {
    const ins = this;
    return Signal.create<R>({
      [Symbol.iterator](): Iterator<R> {
        const inIter = ins.init();
        return {
          next(): IteratorResult<R> {
            const t = inIter.next();
            if (t.done) {
              return {done: true, value: undefined as any};
            } else {
              return {done: false, value: project(t.value)};
            }
          }
        };
      }
    });
  }

  public fold<R>(accumulate: (acc: R, x: T) => R, seed: R): Signal<R> {
    const ins = this;
    return Signal.create<R>({
      [Symbol.iterator](): Iterator<R> {
        const inIter = ins.init();
        let sentSeed = false;
        let acc: R = seed;
        return {
          next(): IteratorResult<R> {
            if (!sentSeed) {
              sentSeed = true;
              return {done: false, value: seed};
            }
            const t = inIter.next();
            if (t.done) {
              return {done: true, value: undefined as any};
            } else {
              const r = accumulate(acc, t.value);
              acc = r;
              return {done: false, value: r};
            }
          }
        };
      }
    });
  }

  public startWith(seed: T): Signal<T> {
    const ins = this;
    return Signal.create<T>({
      [Symbol.iterator](): Iterator<T> {
        const inIter = ins.init();
        let sentSeed = false;
        return {
          next(): IteratorResult<T> {
            if (!sentSeed) {
              sentSeed = true;
              return {done: false, value: seed};
            }
            return inIter.next();
          }
        };
      }
    });
  }

  public compose<U>(operator: (signal: Signal<T>) => Signal<U>): Signal<U> {
    return operator(this);
  }

  public filter(predicate: (t: T) => boolean, max: number = 1000): Signal<T> {
    const ins = this;
    return Signal.create<T>({
      [Symbol.iterator](): Iterator<T> {
        const inIter = ins.init();
        return {
          next(): IteratorResult<T> {
            for (let i = 0; i < max; i++) {
              const t = inIter.next();
              if (t.done) {
                return t;
              }
              if (predicate(t.value)) {
                return t;
              }
            }
            return {done: true, value: undefined as any};
          }
        };
      }
    });
  }

  public drop(amount: number): Signal<T> {
    const ins = this;
    return Signal.create<T>({
      [Symbol.iterator](): Iterator<T> {
        const inIter = ins.init();
        let dropped = 0;
        return {
          next(): IteratorResult<T> {
            while (dropped < amount) {
              const t = inIter.next();
              dropped += 1;
              if (t.done) {
                return t;
              }
            }
            return inIter.next();
          }
        };
      }
    });
  }
}
