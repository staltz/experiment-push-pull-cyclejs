import {Driver} from '../../run/src';
import {init} from 'snabbdom';
import {Module} from 'snabbdom/modules/module';
import {Stream} from '../../xs';
import {Signal} from '../../ys';
import {PushPullProxy} from '../../xy';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNode} from 'snabbdom/vnode';
import {VNodeWrapper} from './VNodeWrapper';
import {getElement} from './utils';
import defaultModules from './modules';

function makeDOMDriverInputGuard(modules: any) {
  if (!Array.isArray(modules)) {
    throw new Error(`Optional modules option must be ` +
     `an array for snabbdom modules`);
  }
}

function domDriverInputGuard(viewS: Signal<VNode>): void {
  if (!viewS
  || typeof viewS.init !== `function`
  || typeof viewS.sample !== `function`) {
    throw new Error(`The DOM driver function expects as input a Signal of ` +
      `virtual DOM elements`);
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

function makeDOMDriver(container: string | Element, options?: DOMDriverOptions) {
  if (!options) { options = {}; }
  const modules = options.modules || defaultModules;
  const patch = init(modules);
  const rootElement = getElement(container) || document.body;
  const vnodeWrapper = new VNodeWrapper(rootElement);
  makeDOMDriverInputGuard(modules);

  function DOMDriver(vnodeProxy: PushPullProxy<VNode>, name = 'DOM'): DOMSource {
    const vnodeS = Signal.create(vnodeProxy);
    domDriverInputGuard(vnodeS);
    const rootElementS = vnodeS
      .map(vnode => vnodeWrapper.call(vnode))
      .fold<VNode | Element>(patch, rootElement)
      .drop(1)
      .map(unwrapElementFromVNode)
      .startWith(rootElement);

    const proxy = new PushPullProxy<Element>();
    let iter = proxy[Symbol.iterator]();

    // Start the snabbdom patching, over time
    const listener = {error: reportSnabbdomError};
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
          iter = rootElementS.init();
          proxy.imitateIterator(iter);
          requestAnimationFrame(function again1() {
            iter.next();
            requestAnimationFrame(again1);
          });
        }
      });
    } else {
      iter = rootElementS.init();
      proxy.imitateIterator(iter);
      requestAnimationFrame(function again2() {
        iter.next();
        requestAnimationFrame(again2);
      });
    }

    return new MainDOMSource(rootElementS, iter, [], name);
  };

  return DOMDriver;
}

export {makeDOMDriver}
