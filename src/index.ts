import { Stream } from "xstream";
import { Signal } from "ysignal";
import { run } from "@cycle/run";
import { div, makeDOMDriver, VNode, DOMSource } from "@cycle/dom";

type Sources = {
  DOM: DOMSource;
  windowHeight: Signal<number>;
};

type Sinks = {
  DOM: any;
};

function main(sources: Sources): Sinks {
  const vdomS = sources.windowHeight.map(height =>
    div(".foo", "Height: " + height)
  );

  return {
    DOM: vdomS
  };
}

run(main, {
  windowHeight: () => Signal.from(() => window.outerHeight),
  DOM: makeDOMDriver("#main-container")
});
