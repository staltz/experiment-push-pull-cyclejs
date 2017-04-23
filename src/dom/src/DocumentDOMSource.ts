import {Stream} from '../../xs';
import {Signal} from '../../ys';
import {adapt} from '../../run/src/adapt';
import {DevToolEnabledSource} from '../../run/src';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {fromEvent} from './fromEvent';

export class DocumentDOMSource implements DOMSource {
  constructor(private _name: string) {
  }

  public select(selector: string): DOMSource {
    // This functionality is still undefined/undecided.
    return this;
  }

  public elements(): Signal<Document> {
    const out: DevToolEnabledSource & Signal<Document> =
      adapt(Stream.of(document));
    out._isCycleSource = this._name;
    return out;
  }

  public events(eventType: string, options: EventsFnOptions = {}): Stream<Event> {
    let stream: Stream<Event>;
    if (options && typeof options.useCapture === 'boolean') {
      stream = fromEvent(document, eventType, options.useCapture);
    } else {
      stream = fromEvent(document, eventType);
    }
    const out: DevToolEnabledSource & Stream<Event> = adapt(stream);
    out._isCycleSource = this._name;
    return out;
  }
}
