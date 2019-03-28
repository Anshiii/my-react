import { REACT_ELEMENT_TYPE } from "../shared/ReactSymbols";

/*  根据 type 创建并返回新的 react element*/
export function createElement (type,config,children){
    let propName;

    const props = {};

    let key =null,ref = null, self = null,source = null;

    if(!config){
        ref = config.ref;
        key = config.key + ''; 
        self = config.__self;
        source = config.__source;

        for(propName in config){
            /* 非上述属性，的属性 */
            props[propName] = config[propName];
        }
    }

    /* children 可以是多个参数传递来的。 */
    const childrenLength = arguments.length - 2;
    /* 会将多个 children 参数组成数组给 props */

    if(type && type.defaultProps){
        // 将默认的 props 值添加到 props 对象
    }


    return RectElement(
        type,
        key,
        ref,
        self,
        source,
                // ReactCurrentOwner.current,
        '',
        props,
    )

}

/* 使用字段 $$typeof  Symbol.for('react.element) 来检查某个对象是否为一个 react element */
function RectElement (type,key,ref,self,source,owner,props){
    const element = {
        $$typeof:REACT_ELEMENT_TYPE,
        type,
        key,
        ref,
        props,
        _owner:owner
    }

    return element;
}