import {Stream} from 'xstream';
import {Signal} from 'ysignal';
import {DevToolEnabledSource} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {DocumentDOMSource} from './DocumentDOMSource';
// import {BodyDOMSource} from './BodyDOMSource';
import {VNode} from 'snabbdom/vnode';
import {fromEvent} from './fromEvent';
import {isolateSink as internalIsolateSink, isolateSource} from './isolate';
import {IsolateModule} from './IsolateModule';
import {getFullScope} from './utils';
import {matchesSelector} from './matchesSelector';

const eventTypesThatDontBubble = [
  `blur`,
  `canplay`,
  `canplaythrough`,
  `change`,
  `durationchange`,
  `emptied`,
  `ended`,
  `focus`,
  `load`,
  `loadeddata`,
  `loadedmetadata`,
  `mouseenter`,
  `mouseleave`,
  `pause`,
  `play`,
  `playing`,
  `ratechange`,
  `reset`,
  `scroll`,
  `seeked`,
  `seeking`,
  `stalled`,
  `submit`,
  `suspend`,
  `timeupdate`,
  `unload`,
  `volumechange`,
  `waiting`,
];

function determineUseCapture(
  eventType: string,
  options: EventsFnOptions,
): boolean {
  let result = false;
  if (typeof options.useCapture === 'boolean') {
    result = options.useCapture;
  }
  if (eventTypesThatDontBubble.indexOf(eventType) !== -1) {
    result = true;
  }
  return result;
}

export class MainDOMSource implements DOMSource {
  constructor(
    private _rootElementS: Signal<Element>,
    private _rootElementIter: Iterator<Element>,
    private _namespace: Array<string> = [],
    private _name: string,
  ) {
    this.isolateSource = isolateSource;
    this.isolateSink = (sink, scope) => {
      const prevFullScope = getFullScope(this._namespace);
      const nextFullScope = [prevFullScope, scope].filter(x => !!x).join('-');
      return internalIsolateSink(sink, nextFullScope) as Stream<VNode>;
    };
  }

  public elements(): Signal<Element> {
    const outputS = this._rootElementS;
    const out: DevToolEnabledSource & Signal<Element> = outputS as any;
    out._isCycleSource = this._name;
    return out;
  }

  get namespace(): Array<string> {
    return this._namespace;
  }

  public select(selector: string): DOMSource {
    if (typeof selector !== 'string') {
      throw new Error(
        `DOM driver's select() expects the argument to be a ` +
          `string as a CSS selector`,
      );
    }
    if (selector === 'document') {
      return new DocumentDOMSource(this._name);
    }
    // if (selector === 'body') {
    //   return new BodyDOMSource(this._name);
    // }
    const trimmedSelector = selector.trim();
    const childNamespace = trimmedSelector === `:root`
      ? this._namespace
      : this._namespace.concat(trimmedSelector);
    return new MainDOMSource(
      this._rootElementS,
      this._rootElementIter,
      childNamespace,
      this._name,
    );
  }

  public events(
    eventType: string,
    options: EventsFnOptions = {},
  ): Stream<Event> {
    if (typeof eventType !== `string`) {
      throw new Error(
        `DOM driver's events() expects argument to be a ` +
          `string representing the event type to listen for.`,
      );
    }
    const useCapture: boolean = determineUseCapture(eventType, options);

    const event$ = Stream.of(null)
      .map(() => {
        const next = this._rootElementIter.next();
        if (next.done) {
          return Stream.empty();
        } else {
          return fromEvent(next.value, eventType, useCapture);
        }
      })
      .flatten();

    const out: DevToolEnabledSource & Stream<Event> = adapt(event$);
    out._isCycleSource = this._name;
    return out;
  }

  public dispose(): void {
    // this._sanitation$.shamefullySendNext(null);
    // this._isolateModule.reset();
  }

  // The implementation of these are in the constructor so that their `this`
  // references are automatically bound to the instance, so that library users
  // can do destructuring `const {isolateSource, isolateSink} = sources.DOM` and
  // not get bitten by a missing `this` reference.

  public isolateSource: (source: MainDOMSource, scope: string) => MainDOMSource;
  public isolateSink: (sink: Stream<VNode>, scope: string) => Stream<VNode>;
}
