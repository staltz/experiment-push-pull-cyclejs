import {Driver} from '@cycle/run';
import {Stream} from 'xstream';
import {Signal} from 'ysignal';
import {constructDOM} from './DOMBuilder';
import {VNode} from './VNode';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNodeWrapper} from './VNodeWrapper';
import {IsolateModule} from './IsolateModule';
import {EventDelegator} from './EventDelegator';
import {getElement} from './utils';
import defaultModules from './modules';

function domDriverInputGuard(view: VNode): void {
  if (!view || typeof view !== `object`) {
    throw new Error(
      `The DOM driver function expects as input a tree of ` +
        `virtual DOM elements`
    );
  }
}

function unwrapElementFromVNode(vnode: VNode): Element {
  return vnode.data.elm as Element;
}

function reportSnabbdomError(err: any): void {
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
        'MimicIterator cannot be pulled before its target iterator is set.'
      );
    }
  }
}

function makeDOMDriver2(
  container: string | Element
) {
  const isolateModule = new IsolateModule();
  const rootElement = getElement(container) || document.body;
  const rootElementS = undefined;
  const vnodeWrapper = new VNodeWrapper(rootElement);
  const delegators = new Map<string, EventDelegator>();

  function DOMDriver(vnode: VNode, name = 'DOM'): DOMSource {
        console.log(vnode);
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
            console.log('ready: ', vnode);
          const [node, setters] = constructDOM(rootElement, vnode);
          console.log('setters', setters);
          requestAnimationFrame(function again1() {
            setters.forEach(fn => { fn(); });
            requestAnimationFrame(again1);
          });
        }
      });
    } else {
        console.log(vnode);
      const [node, setters] = constructDOM(rootElement, vnode);
      requestAnimationFrame(function again2() {
        setters.forEach(fn => { fn(); });
        requestAnimationFrame(again2);
      });
    }
 return undefined as any;
  }

  return DOMDriver;
}

export {makeDOMDriver2};
