import { VNode } from './VNode';
import {Signal} from 'ysignal';
export function constructDOM(parent: Element, root : VNode | Signal<string>) : [VNode | undefined, any[]] { //TODO: Better textNode handling
    if(typeof root === 'function') {
        let textNode = document.createTextNode(root.next());
        parent.appendChild(textNode);
        const setter = () => { textNode.nodeValue = root.next(); };
        return [undefined, [setter]];
    }
    let element = document.createElement(root.tagName);

    const attributeSetters = handleAttributes(element, root.data.attrs);
    const childrenResult = root.children.map(constructDOM.bind(null, element));
    const childrenSetters = (childrenResult[1] as any[][]).reduce((a,b) => a.concat(b), []);

    parent.appendChild(element);

    return [
        {
            tagName: root.tagName,
            data: { ...root.data, elm: element },
            children: childrenResult[0]
        },
        attributeSetters.concat(childrenSetters)
    ];
}

function handleAttributes(element: Element, attrs: any): any[] {
    let setters = [];
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

    return setters;
}
