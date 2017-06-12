import {Stream, Listener} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {Signal} from 'ysignal';
import {DevToolEnabledSource} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {DocumentDOMSource} from './DocumentDOMSource';
import {BodyDOMSource} from './BodyDOMSource';
import {VNode} from 'snabbdom/vnode';
import {fromEvent} from './fromEvent';
import {ElementFinder} from './ElementFinder';
import {totalIsolateSink, siblingIsolateSink, isolateSource} from './isolate';
import {EventDelegator} from './EventDelegator';
import {IsolateModule} from './IsolateModule';
import {getFullScope, isClassOrId} from './utils';
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
  `waiting`
];

function determineUseCapture(
  eventType: string,
  options: EventsFnOptions
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

function filterBasedOnIsolation(domSource: MainDOMSource, fullScope: string) {
  return function filterBasedOnIsolationOperator(
    rootElementS: Signal<Element>
  ): Signal<Element> {
    interface State {
      wasIsolated: boolean;
      shouldPass: boolean;
      element: Element;
    }
    const initialState: State = {
      wasIsolated: false,
      shouldPass: false,
      element: (null as any) as Element
    };

    return rootElementS
      .fold(function checkIfShouldPass(state: State, element: Element) {
        const isIsolated = !!domSource._isolateModule.getElement(fullScope);
        state.shouldPass = isIsolated && !state.wasIsolated;
        state.wasIsolated = isIsolated;
        state.element = element;
        return state;
      }, initialState)
      .drop(1)
      .filter(s => s.shouldPass)
      .map(s => s.element);
  };
}

export class MainDOMSource implements DOMSource {
  constructor(
    private _rootElementS: Signal<Element>,
    private _rootElementIter: Iterator<Element>,
    private _namespace: Array<string> = [],
    public _isolateModule: IsolateModule,
    public _delegators: Map<string, EventDelegator>,
    private _name: string
  ) {
    this.isolateSource = isolateSource;
    this.isolateSink = (sink, scope) => {
      if (scope === ':root') {
        return sink;
      } else if (isClassOrId(scope)) {
        return siblingIsolateSink(sink, scope);
      } else {
        const prevFullScope = getFullScope(this._namespace);
        const nextFullScope = [prevFullScope, scope].filter(x => !!x).join('-');
        return totalIsolateSink(sink, nextFullScope);
      }
    };
  }

  public elements(): Signal<Element> {
    let outputS: Signal<Element | Array<Element>>;
    if (this._namespace.length === 0) {
      outputS = this._rootElementS;
    } else {
      const elementFinder = new ElementFinder(
        this._namespace,
        this._isolateModule
      );
      outputS = this._rootElementS.map(el => elementFinder.call(el));
    }
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
          `string as a CSS selector`
      );
    }
    if (selector === 'document') {
      return new DocumentDOMSource(this._name);
    }
    if (selector === 'body') {
      return new BodyDOMSource(this._name);
    }
    const trimmedSelector = selector.trim();
    const childNamespace = trimmedSelector === `:root`
      ? this._namespace
      : this._namespace.concat(trimmedSelector);
    return new MainDOMSource(
      this._rootElementS,
      this._rootElementIter,
      childNamespace,
      this._isolateModule,
      this._delegators,
      this._name
    );
  }

  public events(
    eventType: string,
    options: EventsFnOptions = {}
  ): Stream<Event> {
    if (typeof eventType !== `string`) {
      throw new Error(
        `DOM driver's events() expects argument to be a ` +
          `string representing the event type to listen for.`
      );
    }
    const useCapture: boolean = determineUseCapture(eventType, options);

    const namespace = this._namespace;
    const fullScope = getFullScope(namespace);
    const keyParts = [eventType, useCapture];
    if (fullScope) {
      keyParts.push(fullScope);
    }
    const key = keyParts.join('~');
    const domSource = this;

    const domInteractive$ = fromEvent(document, 'readystatechange', false)
      .filter(() => document.readyState === 'interactive')
      .take(1);

    const ready$: Stream<any> = document.readyState === 'loading'
      ? domInteractive$
      : Stream.of(null);

    const animationFrame$: Stream<null> = Stream.create({
      start: function(listener: Listener<null>) {
        const animationFrameProducer = this;
        this.running = true;
        requestAnimationFrame(function again2() {
          listener.next(null);
          if (animationFrameProducer.running) {
            requestAnimationFrame(again2);
          }
        });
      },
      stop: function() {
        this.running = false;
      }
    });

    const rootElementS: Signal<Element> = fullScope
      ? this._rootElementS.compose(filterBasedOnIsolation(domSource, fullScope))
      : this._rootElementS;

    const event$: Stream<Event> = ready$
      .mapTo(animationFrame$)
      .flatten()
      .sample(rootElementS)
      .compose(dropRepeats())
      .map(function setupEventDelegatorOnTopElement(rootElement) {
        // Event listener just for the root element
        if (!namespace || namespace.length === 0) {
          return fromEvent(
            rootElement,
            eventType,
            useCapture,
            options.preventDefault
          );
        }

        // Event listener on the origin element as an EventDelegator
        const delegators = domSource._delegators;
        const origin =
          domSource._isolateModule.getElement(fullScope) || rootElement;
        let delegator: EventDelegator;
        if (delegators.has(key)) {
          delegator = delegators.get(key) as EventDelegator;
          delegator.updateOrigin(origin);
        } else {
          delegator = new EventDelegator(
            origin,
            eventType,
            useCapture,
            domSource._isolateModule,
            options.preventDefault
          );
          delegators.set(key, delegator);
        }
        if (fullScope) {
          domSource._isolateModule.addEventDelegator(fullScope, delegator);
        }

        const subject = delegator.createDestination(namespace);
        return subject;
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
  public isolateSink: typeof siblingIsolateSink;
}
