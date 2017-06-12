import {Driver} from '@cycle/run';
import {init} from 'snabbdom';
import {Module} from 'snabbdom/modules/module';
import {Stream} from 'xstream';
import {Signal} from 'ysignal';
import {VNode} from './VNode';
import {constructDOM} from './DOMBuilder';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNodeWrapper} from './VNodeWrapper';
import {getElement} from './utils';
import defaultModules from './modules';

function domDriverInputGuard(view: VNode): void {
  if (!view || typeof view !== `object`) {
    throw new Error(
      `The DOM driver function expects a tree of virtual DOM elements`,
    );
  }
}

function unwrapElementFromVNode(vnode: VNode): Element {
  return vnode.data.elm as Element;
}

function reportError(err: any): void {
  (console.error || console.log)(err);
}

class MimicIterator<T> implements Iterator<T> {
  private target: Iterator<T> | undefined;

  constructor() {}

  public imitate(target: Iterator<T>) {
    this.target = target;
  }

  public next(value?: any): IteratorResult<T> {
    const target = this.target;
    if (target) {
      return target.next(value);
    } else {
      throw new Error(
        'MimicIterator cannot be pulled before its target iterator is set.',
      );
    }
  }
}

function makeDOMDriver2(
  container: string | Element
) {
  const rootElement = getElement(container) || document.body;

  function DOMDriver(vnode: VNode, name = 'DOM'): DOMSource {
    domDriverInputGuard(vnode);
    const rootElementS = undefined;
    const iter: MimicIterator<Element> = new MimicIterator<Element>();

    // Start the snabbdom patching, over time
    const listener = {error: reportError};
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
              const setters = constructDOM(rootElement, vnode);
          requestAnimationFrame(function again1() {
        setters.forEach(fn => {
          if(fn && fn[1]) { fn[1](); }
        });
              requestAnimationFrame(again1);
          });
        }
      });
    } else {
      const setters = constructDOM(rootElement, vnode);
      requestAnimationFrame(function again2() {
        setters.forEach(fn => {
          if(fn && fn[1]) { fn[1](); }
        });
        requestAnimationFrame(again2);
      });
    }

    return new MainDOMSource(rootElementS, iter, [], name);
  }

  return DOMDriver;
}

export {makeDOMDriver2};
