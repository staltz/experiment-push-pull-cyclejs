**An experiment in having both push and pull collections in Cycle.js**

Highlights in this repo:

- See index.ts for the example app
- ys is the implementation of Signal
- xs is a fork of xstream to add some Signal stuff
- xy is a proxy "stream" that can be used either to imitate streams or signals
- The DOM Driver was modified. Main changes are in makeDOMDriver and MainDOMSource, uses requestAnimationFrame to pull the chain of signals. We're ignoring isolation and proper event handling for now in this proof of concept.
- Cycle Run was modified. Main changes are in replicateMany, to use xy as proxies
