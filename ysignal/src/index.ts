export type Getter<T> = () => T;

export class Signal<T> implements Iterable<T> {
  constructor(iterable: Iterable<T>) {
    this.iterable = iterable;
  }

  private iterable: Iterable<T>;

  public [Symbol.iterator](): Iterator<T> {
    return this.init();
  }

  public static create<T>(iterable: Iterable<T>): Signal<T> {
    return new Signal<T>(iterable);
  }

  public init(): Iterator<T> {
    return this.iterable[Symbol.iterator]();
  }

  public static from<T>(getter: Getter<T>): Signal<T> {
    return Signal.create<T>({
      [Symbol.iterator](): Iterator<T> {
        return {
          next(): IteratorResult<T> {
            return {value: getter(), done: false};
          },
        };
      },
    });
  }

  public static constant<T>(val: T): Signal<T> {
    return Signal.from<T>(() => val);
  }

  // public take(amount: number): Signal<T> {
  // }

  // public sampleCombine<R>(stream: Stream<R>): Stream<[T, R]> {
  //   return stream.map(x => [this._pull(), x] as [T, R]);
  // }

  public map<R>(project: (x: T) => R): Signal<R> {
    const ins = this;
    return Signal.create<R>({
      [Symbol.iterator](): Iterator<R> {
        const tIter = ins.init();
        return {
          next(): IteratorResult<R> {
            const t = tIter.next();
            if (t.done) {
              return {done: true, value: undefined as any};
            } else {
              return {done: false, value: project(t.value)};
            }
          },
        };
      },
    });
  }

  public fold<R>(accumulate: (acc: R, x: T) => R, seed: R): Signal<R> {
    const ins = this;
    return Signal.create<R>({
      [Symbol.iterator](): Iterator<R> {
        const tIter = ins.init();
        let sentSeed = false;
        let acc: R = seed;
        return {
          next(): IteratorResult<R> {
            if (!sentSeed) {
              sentSeed = true;
              return {done: false, value: seed};
            }
            const t = tIter.next();
            if (t.done) {
              return {done: true, value: undefined as any};
            } else {
              const r = accumulate(acc, t.value);
              acc = r;
              return {done: false, value: r};
            }
          },
        };
      },
    });
  }

  public startWith(seed: T): Signal<T> {
    const ins = this;
    return Signal.create<T>({
      [Symbol.iterator](): Iterator<T> {
        const tIter = ins.init();
        let sentSeed = false;
        return {
          next(): IteratorResult<T> {
            if (!sentSeed) {
              sentSeed = true;
              return {done: false, value: seed};
            }
            return tIter.next();
          },
        };
      },
    });
  }

  public compose<U>(operator: (signal: Signal<T>) => Signal<U>): Signal<U> {
    return operator(this);
  }

  public drop(amount: number): Signal<T> {
    const ins = this;
    return Signal.create<T>({
      [Symbol.iterator](): Iterator<T> {
        const tIter = ins.init();
        let dropped = 0;
        return {
          next(): IteratorResult<T> {
            while (dropped < amount) {
              const t = tIter.next();
              dropped += 1;
              if (t.done) {
                return t;
              }
            }
            return tIter.next();
          },
        };
      },
    });
  }
}
