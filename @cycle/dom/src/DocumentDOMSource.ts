import {Stream} from 'xstream';
import {Signal} from 'ysignal';
import {adapt} from '@cycle/run/lib/adapt';
import {DevToolEnabledSource} from '@cycle/run';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {fromEvent} from './fromEvent';

export class DocumentDOMSource implements DOMSource {
  constructor(private _name: string) {}

  public select(selector: string): DOMSource {
    // This functionality is still undefined/undecided.
    return this;
  }

  public elements(): Signal<Document> {
    const out: DevToolEnabledSource & Signal<Document> = adapt(
      Stream.of(document)
    );
    out._isCycleSource = this._name;
    return out;
  }

  public events(
    eventType: string,
    options: EventsFnOptions = {}
  ): Stream<Event> {
    const stream = fromEvent(
      document.body,
      eventType,
      options.useCapture,
      options.preventDefault
    );
    const out: DevToolEnabledSource & Stream<Event> = adapt(stream);
    out._isCycleSource = this._name;
    return out;
  }
}
