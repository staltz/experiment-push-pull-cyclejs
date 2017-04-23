import {Stream, Listener, Operator} from './xs';

export type Getter<T> = () => T;

class Sample<T> implements Operator<T, T> {
  public type = 'sample';
  public ins: Stream<T>;
  public out: Stream<T> | null;
  public sig: Signal<T>;
  public itr: Iterator<T> | null;

  constructor(signal: Signal<T>, ins: Stream<T>) {
    this.ins = ins;
    this.out = null;
    this.sig = signal;
    this.itr = null;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.itr = this.sig.init();
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.itr.return();
    this.itr = null;
  }

  _n(t: T) {
    const u = this.out;
    if (u === null) {
      return;
    }
    let r;
    try {
      r = this.itr.next();
    } catch (e) {
      u._e(e);
      return;
    }
    if (r.done) {
      u._c();
    } else {
      u._n(r.value);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (u === null) {
      return;
    }
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (u === null) {
      return;
    }
    u._c();
  }
}

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

  public sample(sampler: Stream<any>): Stream<T> {
    return new Stream<T>(new Sample<T>(this, sampler));
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
              return {done: true, value: undefined};
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
              return {done: true, value: undefined};
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
