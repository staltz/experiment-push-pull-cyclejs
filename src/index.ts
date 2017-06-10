import {Stream} from 'xstream';
import {Signal} from 'ysignal';
import {run} from '@cycle/run';
import onionify, {StateSource, Reducer} from 'cycle-onionify';
import {div, button, makeDOMDriver, VNode, DOMSource} from '@cycle/dom';

type State = {
  count: number;
};

type Sources = {
  DOM: DOMSource;
  state: StateSource<State>;
  windowHeight: Signal<number>;
};

type Sinks = {
  DOM: any;
  state: Stream<Reducer<State>>;
};

function main(sources: Sources): Sinks {
  const click$ = sources.DOM.select('.foo').events('click').mapTo(null);

  const incrementReducer$ = click$.mapTo(function incrementReducer(
    prevState: State
  ): State {
    return {
      count: prevState.count + 1
    };
  });

  const initialReducer$ = Stream.of(function initialReducer(): State {
    return {count: 0};
  });

  const reducer$ = Stream.merge(initialReducer$, incrementReducer$);

  const vdomS = Signal.combine(
    sources.state.stateS,
    sources.windowHeight
  ).map(([state, height]) =>
    div('.container', [
      div('.height', 'Height: ' + height),
      button('.foo', 'Count: ' + state.count),
      div('.not', 'Not this')
    ])
  );

  return {
    DOM: vdomS,
    state: reducer$
  };
}

run(onionify<any, any, any>(main, 'state'), {
  windowHeight: () => Signal.from(() => window.outerHeight),
  DOM: makeDOMDriver('#main-container')
});
