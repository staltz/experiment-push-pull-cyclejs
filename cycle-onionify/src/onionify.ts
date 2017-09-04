import xs, {Stream, Subscription} from 'xstream';
import ys, {Signal, startWith}  from 'ysignal';
import {MainFn, Reducer} from './types';
import {StateSource} from './StateSource';

class FoldIterator<T> implements Iterator<T | undefined> {
  private seed: T;
  private acc: T | undefined;
  private done: boolean;
  private reducer$: Stream<Reducer<T>>;
  private subscription: Subscription;
  private count: number;
  private latestRes: IteratorResult<T | undefined> | undefined;
  private latestCount: number;

  constructor(seed: T, reducer$: Stream<Reducer<T>>) {
    this.seed = seed;
    this.reducer$ = reducer$;
    this.acc = seed;
    this.done = false;
    this.count = 0;
    this.latestCount = -1;
    const foldIterator = this;
    this.subscription = reducer$.subscribe({
      next: (reducer: Reducer<T>) => {
        const next = reducer(foldIterator.acc);
        if (typeof next !== 'undefined') {
          foldIterator.acc = next;
          foldIterator.count++;
        }
      },
      error: (e: any) => {},
      complete: () => {
        foldIterator.done = true;
        foldIterator.count++;
      }
    });
  }

  next(): IteratorResult<T | undefined> {
    if (this.latestCount >= 0 && this.latestCount === this.count) {
      return this.latestRes as IteratorResult<T>;
    } else {
      this.latestCount = this.count;
      this.latestRes = {
        done: this.done,
        value: this.done ? undefined : this.acc
      };
      return this.latestRes;
    }
  }

  return(): IteratorResult<T | undefined> {
    this.subscription.unsubscribe();
    return {done: true, value: undefined};
  }
}

function fold<T>(seed: T, reducer$: Stream<Reducer<T>>): Signal<T | undefined> {
  return ys.create<T | undefined>({
    [Symbol.iterator](): Iterator<T | undefined> {
      return new FoldIterator(seed, reducer$);
    }
  });
}

/**
 * While we are waiting for keyof subtraction to land in TypeScript,
 * https://github.com/Microsoft/TypeScript/issues/12215,
 * we must use `any` as the type of sources or sinks in the mainOnionified.
 * This is because the correct type is *not*
 *
 * Main<So, Si>
 *
 * *neither*
 *
 * Main<Partial<So>, Partial<Si>>
 *
 * The former will signal to Cycle.run that a driver for 'onion' is needed,
 * while the latter will make valid channels like 'DOM' become optional.
 * The correct type should be
 *
 * Main<Omit<So, 'onion'>, Omit<Si, 'onion'>>
 */
export type Omit<T, K extends keyof T> = any;
// type Omit<T, K extends keyof T> = {
//     [P in keyof T - K]: T[P];
// };

export type OSo<T> = {onion: StateSource<T>};
export type OSi<T> = {onion: Stream<Reducer<T>>};

export type MainOnionified<T, So extends OSo<T>, Si extends OSi<T>> = MainFn<
  Omit<So, 'onion'>,
  Omit<Si, 'onion'>
>;

export function onionify<T, So extends OSo<T>, Si extends OSi<T>>(
  main: MainFn<So, Si>,
  name: string = 'onion'
): MainOnionified<T, So, Si> {
  return function mainOnionified(
    sources: Omit<So, 'onion'>
  ): Omit<Si, 'onion'> {
    const reducerMimic$ = xs.create<Reducer<T>>();
      const stateS =  startWith(void 0)(reducerMimic$
        .fold((state, reducer) => reducer(state), void 0 as (T | undefined))
        .drop(1));

    sources[name] = new StateSource<any>(stateS, name);
    const sinks = main(sources as So);
    if (sinks[name]) {
      reducerMimic$.imitate(xs.fromObservable<Reducer<T>>(sinks[name]));
    }
    return sinks;
  };
}
