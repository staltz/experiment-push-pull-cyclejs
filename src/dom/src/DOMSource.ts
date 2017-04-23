import {Stream} from '../../xs';
import {Signal} from '../../ys';
export interface EventsFnOptions {
  useCapture?: boolean;
}

export interface DOMSource {
  select<S extends DOMSource>(selector: string): S;
  elements(): Signal<Document | Element | Array<Element> | string>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
