import { Transformer } from '../../xstream_new';
import { ISignal } from '../../ysignal_new';
export declare function sampleCombine<T>(...signals: ISignal<any>[]): Transformer<T, any[]>;
