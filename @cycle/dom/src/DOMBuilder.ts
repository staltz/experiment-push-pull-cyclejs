import { VNode } from './VNode';
import {Signal} from 'ysignal';

export function constructDOM(parent: Element, root : VNode | Signal<string>) : any[] { //TODO: Return VNode
    if(typeof root.init === 'function') {
        const signal = root.init();
        let prev = signal.next().value;
        let textNode = document.createTextNode(prev);
        parent.appendChild(textNode);
        const setter = () => {
            const next = signal.next().value;
            if(next !== prev) {
                textNode.nodeValue = signal.next().value;
                prev = next;
            }
        };
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
    let setters : any[] = [];
    if(attrs) {
    Object.keys(attrs).forEach(key => {
        const value = attrs[key];
        if(typeof value !== 'function') {
            element.setAttribute(key, value);
        } else {
            value.init();
            let prev : any = undefined;
            const setter = () => {
                const next = value.next().value;
                if(next !== prev) {
                    element.setAttribute(key, next);
                    prev = next;
                }
            };
            setters.push(setter);
        }
    });
    }

    return setters;
}
