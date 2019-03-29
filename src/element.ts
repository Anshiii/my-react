export const TEXT_ELEMENT = "TEXT ELEMENT";


/**
 *
 *
 * @export
 * @param {*} type 元素的类型 组件的话就是函数本身/
 * @param {*} config
 * @param {*} args children 可作为一系列参数传递进来
 */
export function createElement(type,config,...args):Element{
    const props = Object.assign({},config);
    const hasChildren = args.length>0;
    const rawChildren = hasChildren ? [...args]:[]; // 类数组转为数组
    // 过滤 空和false 值的子元素
    props.children = rawChildren.filter(c => c != null && c !==false)
    .map(c => c instanceof Object?c:createTextElement(c));

    return {type,props}
}

function createTextElement(value:string){
    return createElement(TEXT_ELEMENT,{nodeValue:value})
}