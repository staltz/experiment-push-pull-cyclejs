import {Signal} from './index';

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
