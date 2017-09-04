import {Driver, PushPullProxy} from '@cycle/run';
import {init} from 'snabbdom';
import {Module} from 'snabbdom/modules/module';
import {Stream} from 'xstream';
import ys, {Signal} from 'ysignal';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNode} from 'snabbdom/vnode';
import {VNodeWrapper} from './VNodeWrapper';
import {IsolateModule} from './IsolateModule';
import {EventDelegator} from './EventDelegator';
import {getElement} from './utils';
import defaultModules from './modules';

function makeDOMDriverInputGuard(modules: any) {
  if (!Array.isArray(modules)) {
    throw new Error(
      `Optional modules option must be ` + `an array for snabbdom modules`
    );
  }
}

function domDriverInputGuard(viewS: Signal<VNode>): void {
  if (!viewS || typeof viewS.init !== `function`) {
    throw new Error(
      `The DOM driver function expects as input a Signal of ` +
        `virtual DOM elements`
    );
  }
}

export interface DOMDriverOptions {
  modules?: Array<Module>;
}

function unwrapElementFromVNode(vnode: VNode): Element {
  return vnode.elm as Element;
}

function reportSnabbdomError(err: any): void {
  (console.error || console.log)(err);
}

function makeDOMDriver(
  container: string | Element,
  options?: DOMDriverOptions
) {
  if (!options) {
    options = {};
  }
  const modules = options.modules || defaultModules;
  const isolateModule = new IsolateModule();
  const patch = init([isolateModule.createModule()].concat(modules));
  const rootElement = getElement(container) || document.body;
  const vnodeWrapper = new VNodeWrapper(rootElement);
  const delegators = new Map<string, EventDelegator>();
  makeDOMDriverInputGuard(modules);

  function DOMDriver(vnodeProxy: Iterable<VNode>, name = 'DOM'): DOMSource {
    const vnodeS = ys.create(vnodeProxy);
    domDriverInputGuard(vnodeS);
    const rootElementS = vnodeS
      .map(vnode => vnodeWrapper.call(vnode))
      .fold<VNode | Element>(patch, rootElement)
      .drop(1)
      .map(unwrapElementFromVNode)
      .fold(x => x, rootElement);

    const rootElementProxyS = new PushPullProxy<Element>();
    const iter: Iterator<Element> = rootElementProxyS[Symbol.iterator]();

    // Start the snabbdom patching, over time
    const listener = {error: reportSnabbdomError};
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
          rootElementProxyS.imitateIterator(rootElementS.init());
          requestAnimationFrame(function again1() {
            iter.next();
            requestAnimationFrame(again1);
          });
        }
      });
    } else {
      rootElementProxyS.imitateIterator(rootElementS.init());
      requestAnimationFrame(function again2() {
        iter.next();
        requestAnimationFrame(again2);
      });
    }

    return new MainDOMSource(
      rootElementS,
      iter,
      [],
      isolateModule,
      delegators,
      name
    );
  }

  return DOMDriver;
}

export {makeDOMDriver};
