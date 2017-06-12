import {Stream} from 'xstream';
import {Signal} from 'ysignal';
export interface EventsFnOptions {
  useCapture?: boolean;
  preventDefault?: boolean;
}

export interface DOMSource {
  select<S extends DOMSource>(selector: string): S;
  elements(): Signal<Document | Element | Array<Element> | string>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
