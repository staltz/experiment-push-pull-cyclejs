import { Signal } from 'ysignal';

export interface VNode {
    tagName: string;
    data: VNodeData;
    children: (VNode | Signal<string>)[];
}

export interface VNodeData {
    attrs: { [key: string]: Signal<any> | any }; //TODO: explicit list with all possible attrs
    elm?: Element;
    //TODO: Add more options here
}
