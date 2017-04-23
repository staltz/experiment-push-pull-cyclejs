import {Stream} from './xs';
import {Signal} from './ys';
import {run} from './run/src';
import {div, makeDOMDriver, VNode, DOMSource} from './dom/src';

type Sources = {
  DOM: DOMSource,
  windowHeight: Signal<number>,
};

type Sinks = {
  DOM: any,
};

function main(sources: Sources): Sinks {
  const vdomS = sources.windowHeight.map(height =>
    div('.foo', 'Height: ' + height),
  );

  return {
    DOM: vdomS,
  };
}

run(main, {
  windowHeight: () => Signal.from(() => window.outerHeight),
  DOM: makeDOMDriver('#main-container'),
});
