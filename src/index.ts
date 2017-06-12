import xs, {Stream} from 'xstream';
import {Signal} from 'ysignal';
import {run} from '@cycle/run';
import {makeDOMDriver2, VNode, DOMSource} from '@cycle/dom';

type Sources = {
  DOM: DOMSource;
  windowHeight: Signal<number>;
};

type Sinks = {
  DOM: any;
};

function main(sources: Sources): Sinks {
  const vdom = {
      tagName: 'div',
      data: {},
      children: [
         {
             tagName: 'div',
             data: {},
             children: [sources.windowHeight.map(h => 'Height: ' + h)]
         }
      ]
  };

  return {
    DOM: vdom
  };
}

const t = main({ windowHeight: Signal.from(() => window.outerHeight) } as any);

makeDOMDriver2('#main-container')(t.DOM);
