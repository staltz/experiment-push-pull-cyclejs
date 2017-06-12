import { VNode } from './VNode';
import {Signal} from 'ysignal';

export function constructDOM(parent: Element, root : VNode | Signal<string>) : any[] { //TODO: Return VNode
    if(typeof root.init === 'function') {
        const signal = root.init();
        const next = signal.next();
        let textNode = document.createTextNode(next.value);
        parent.appendChild(textNode);
        const setter = () => { textNode.nodeValue = signal.next().value; };
        return [undefined, [setter]];
    }
    let element = document.createElement(root.tagName);

    const attributeSetters = handleAttributes(element, root.data.attrs);
    const childrenResult = root.children.map(e => constructDOM(element, e))
    console.log(childrenResult);
    const childrenSetters = (childrenResult as any).reduce((a,b) => a.concat(b), []);

    parent.appendChild(element);

    return attributeSetters.concat(childrenSetters);
}

function handleAttributes(element: Element, attrs: any): any[] {
    let setters = [];
    if(attrs) {
    Object.keys(attrs).forEach(key => {
        const value = attrs[key];
        if(typeof value !== 'function') {
            element.setAttribute(key, value);
        } else {
            const setter = () => element.setAttribute(key, value.next());
            setter();
            setters.push(setter);
        }
    });
    }

    return setters;
}
