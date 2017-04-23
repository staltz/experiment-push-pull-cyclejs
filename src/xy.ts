import {MemoryStream} from './xs';

export class PushPullProxy<T> extends MemoryStream<T> implements Iterable<T> {
  constructor() {
    super();
    this.iterator = {
      next() {
        return {done: false, value: undefined};
      },
    };
  }

  public [Symbol.iterator](): Iterator<T> {
    return this.iterator;
  }

  private iterator: Iterator<T>;

  public imitateIterator(iterator: Iterator<T>): void {
    this.iterator = iterator;
  }
}
