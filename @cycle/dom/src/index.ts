export {thunk, Thunk, ThunkData} from 'snabbdom/thunk';
export {VNode, VNodeData} from 'snabbdom/vnode';
export {DOMSource, EventsFnOptions} from './DOMSource';
export {MainDOMSource} from './MainDOMSource';
/**
 * A factory for the DOM driver function.
 *
 * Takes a `container` to define the target on the existing DOM which this
 * driver will operate on, and an `options` object as the second argument. The
 * input to this driver is a stream of virtual DOM objects, or in other words,
 * Snabbdom "VNode" objects. The output of this driver is a "DOMSource": a
 * collection of Observables queried with the methods `select()` and `events()`.
 *
 * `DOMSource.select(selector)` returns a new DOMSource with scope restricted to
 * the element(s) that matches the CSS `selector` given.
 *
 * `DOMSource.events(eventType, options)` returns a stream of events of
 * `eventType` happening on the elements that match the current DOMSource. The
 * event object contains the `ownerTarget` property that behaves exactly like
 * `currentTarget`. The reason for this is that some browsers doesn't allow
 * `currentTarget` property to be mutated, hence a new property is created. The
 * returned stream is an *xstream* Stream if you use `@cycle/xstream-run` to run
 * your app with this driver, or it is an RxJS Observable if you use
 * `@cycle/rxjs-run`, and so forth. The `options` parameter can have the
 * property `useCapture`, which is by default `false`, except it is `true` for
 * event types that do not bubble. Read more here
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 * about the `useCapture` and its purpose.
 *
 * `DOMSource.elements()` returns a stream of the DOM element(s) matched by the
 * selectors in the DOMSource. Also, `DOMSource.select(':root').elements()`
 * returns a stream of DOM element corresponding to the root (or container) of
 * the app on the DOM.
 *
 * @param {(String|HTMLElement)} container the DOM selector for the element
 * (or the element itself) to contain the rendering of the VTrees.
 * @param {DOMDriverOptions} options an object with two optional properties:
 *
 *   - `modules: array` overrides `@cycle/dom`'s default Snabbdom modules as
 *     as defined in [`src/modules.ts`](./src/modules.ts).
 *   - `transposition: boolean` enables/disables transposition of inner streams
 *     in the virtual DOM tree.
 * @return {Function} the DOM driver function. The function expects a stream of
 * VNode as input, and outputs the DOMSource object.
 * @function makeDOMDriver
 */
//export {makeDOMDriver, DOMDriverOptions} from './makeDOMDriver';
export {makeDOMDriver2} from './makeDOMDriver2';
/**
 * The hyperscript function `h()` is a function to create virtual DOM objects,
 * also known as VNodes. Call
 *
 * ```js
 * h('div.myClass', {style: {color: 'red'}}, [])
 * ```
 *
 * to create a VNode that represents a `DIV` element with className `myClass`,
 * styled with red color, and no children because the `[]` array was passed. The
 * API is `h(tagOrSelector, optionalData, optionalChildrenOrText)`.
 *
 * However, usually you should use "hyperscript helpers", which are shortcut
 * functions based on hyperscript. There is one hyperscript helper function for
 * each DOM tagName, such as `h1()`, `h2()`, `div()`, `span()`, `label()`,
 * `input()`. For instance, the previous example could have been written
 * as:
 *
 * ```js
 * div('.myClass', {style: {color: 'red'}}, [])
 * ```
 *
 * There are also SVG helper functions, which apply the appropriate SVG
 * namespace to the resulting elements. `svg()` function creates the top-most
 * SVG element, and `svg.g`, `svg.polygon`, `svg.circle`, `svg.path` are for
 * SVG-specific child elements. Example:
 *
 * ```js
 * svg({width: 150, height: 150}, [
 *   svg.polygon({
 *     attrs: {
 *       class: 'triangle',
 *       points: '20 0 20 150 150 20'
 *     }
 *   })
 * ])
 * ```
 *
 * @function h
 */
export {h} from './hyperscript';
import hh, {HyperScriptHelperFn, SVGHelperFn} from './hyperscript-helpers';

export const svg: SVGHelperFn = hh.svg;
export const a: HyperScriptHelperFn = hh.a;
export const abbr: HyperScriptHelperFn = hh.abbr;
export const address: HyperScriptHelperFn = hh.address;
export const area: HyperScriptHelperFn = hh.area;
export const article: HyperScriptHelperFn = hh.article;
export const aside: HyperScriptHelperFn = hh.aside;
export const audio: HyperScriptHelperFn = hh.audio;
export const b: HyperScriptHelperFn = hh.b;
export const base: HyperScriptHelperFn = hh.base;
export const bdi: HyperScriptHelperFn = hh.bdi;
export const bdo: HyperScriptHelperFn = hh.bdo;
export const blockquote: HyperScriptHelperFn = hh.blockquote;
export const body: HyperScriptHelperFn = hh.body;
export const br: HyperScriptHelperFn = hh.br;
export const button: HyperScriptHelperFn = hh.button;
export const canvas: HyperScriptHelperFn = hh.canvas;
export const caption: HyperScriptHelperFn = hh.caption;
export const cite: HyperScriptHelperFn = hh.cite;
export const code: HyperScriptHelperFn = hh.code;
export const col: HyperScriptHelperFn = hh.col;
export const colgroup: HyperScriptHelperFn = hh.colgroup;
export const dd: HyperScriptHelperFn = hh.dd;
export const del: HyperScriptHelperFn = hh.del;
export const dfn: HyperScriptHelperFn = hh.dfn;
export const dir: HyperScriptHelperFn = hh.dir;
export const div: HyperScriptHelperFn = hh.div;
export const dl: HyperScriptHelperFn = hh.dl;
export const dt: HyperScriptHelperFn = hh.dt;
export const em: HyperScriptHelperFn = hh.em;
export const embed: HyperScriptHelperFn = hh.embed;
export const fieldset: HyperScriptHelperFn = hh.fieldset;
export const figcaption: HyperScriptHelperFn = hh.figcaption;
export const figure: HyperScriptHelperFn = hh.figure;
export const footer: HyperScriptHelperFn = hh.footer;
export const form: HyperScriptHelperFn = hh.form;
export const h1: HyperScriptHelperFn = hh.h1;
export const h2: HyperScriptHelperFn = hh.h2;
export const h3: HyperScriptHelperFn = hh.h3;
export const h4: HyperScriptHelperFn = hh.h4;
export const h5: HyperScriptHelperFn = hh.h5;
export const h6: HyperScriptHelperFn = hh.h6;
export const head: HyperScriptHelperFn = hh.head;
export const header: HyperScriptHelperFn = hh.header;
export const hgroup: HyperScriptHelperFn = hh.hgroup;
export const hr: HyperScriptHelperFn = hh.hr;
export const html: HyperScriptHelperFn = hh.html;
export const i: HyperScriptHelperFn = hh.i;
export const iframe: HyperScriptHelperFn = hh.iframe;
export const img: HyperScriptHelperFn = hh.img;
export const input: HyperScriptHelperFn = hh.input;
export const ins: HyperScriptHelperFn = hh.ins;
export const kbd: HyperScriptHelperFn = hh.kbd;
export const keygen: HyperScriptHelperFn = hh.keygen;
export const label: HyperScriptHelperFn = hh.label;
export const legend: HyperScriptHelperFn = hh.legend;
export const li: HyperScriptHelperFn = hh.li;
export const link: HyperScriptHelperFn = hh.link;
export const main: HyperScriptHelperFn = hh.main;
export const map: HyperScriptHelperFn = hh.map;
export const mark: HyperScriptHelperFn = hh.mark;
export const menu: HyperScriptHelperFn = hh.menu;
export const meta: HyperScriptHelperFn = hh.meta;
export const nav: HyperScriptHelperFn = hh.nav;
export const noscript: HyperScriptHelperFn = hh.noscript;
export const object: HyperScriptHelperFn = hh.object;
export const ol: HyperScriptHelperFn = hh.ol;
export const optgroup: HyperScriptHelperFn = hh.optgroup;
export const option: HyperScriptHelperFn = hh.option;
export const p: HyperScriptHelperFn = hh.p;
export const param: HyperScriptHelperFn = hh.param;
export const pre: HyperScriptHelperFn = hh.pre;
export const progress: HyperScriptHelperFn = hh.progress;
export const q: HyperScriptHelperFn = hh.q;
export const rp: HyperScriptHelperFn = hh.rp;
export const rt: HyperScriptHelperFn = hh.rt;
export const ruby: HyperScriptHelperFn = hh.ruby;
export const s: HyperScriptHelperFn = hh.s;
export const samp: HyperScriptHelperFn = hh.samp;
export const script: HyperScriptHelperFn = hh.script;
export const section: HyperScriptHelperFn = hh.section;
export const select: HyperScriptHelperFn = hh.select;
export const small: HyperScriptHelperFn = hh.small;
export const source: HyperScriptHelperFn = hh.source;
export const span: HyperScriptHelperFn = hh.span;
export const strong: HyperScriptHelperFn = hh.strong;
export const style: HyperScriptHelperFn = hh.style;
export const sub: HyperScriptHelperFn = hh.sub;
export const sup: HyperScriptHelperFn = hh.sup;
export const table: HyperScriptHelperFn = hh.table;
export const tbody: HyperScriptHelperFn = hh.tbody;
export const td: HyperScriptHelperFn = hh.td;
export const textarea: HyperScriptHelperFn = hh.textarea;
export const tfoot: HyperScriptHelperFn = hh.tfoot;
export const th: HyperScriptHelperFn = hh.th;
export const thead: HyperScriptHelperFn = hh.thead;
export const title: HyperScriptHelperFn = hh.title;
export const tr: HyperScriptHelperFn = hh.tr;
export const u: HyperScriptHelperFn = hh.u;
export const ul: HyperScriptHelperFn = hh.ul;
export const video: HyperScriptHelperFn = hh.video;
