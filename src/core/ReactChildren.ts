
import {REACT_ELEMENT_TYPE,REACT_PORTAL_TYPE,getIteratorFn} from '../shared/ReactSymbols'
/* 非 api 函数 start */


/* 转移并包装 key 值，使其可作为 reactid */
function escape(key:string){
    const escapeRegex = /[=:]/g;
    const escaperLookup = {
        '=':'=0',
        ':':'=2',
    }
    /* 将= 和 : 替换成 =0 和 =2 */
    const escapedString = ('' + key).replace(escapeRegex,function(match){
        return escaperLookup[match];
    });

    return '$' + escapedString;
}
/* 用于生成字符串 key 值用于标识一系列组件 */
function getComponentKey (component:object,index:number){
    if(typeof component === 'object' &&
    component !== null &&
    component.key != null){
        return escape(component.key)
    }
    return index.toString(36)
}

const SEPARATOR = '.';
const SUBSEPARATOR = ':';

/* 
遍历所有的子节点。
 nameSoFar - 记录遍历至今的路径
 cb - 每一个子节点相关调用
 traverseContext - 传递信息的上下文
 */
function traverseAllChildrenImpl(
    children:object,
    nameSoFar:string,
    callback: any
):number{
    const type = typeof children;
    if(type === 'undefined' || type === 'boolean'){
        children = null;
    }

    let invokeCallback = false;

    /* 指定的 children 类型 invokeCallback 才会设置为 true */
    if(children === null){
        invokeCallback = true;
    }else{
        switch(type){
            case 'string':
            case 'number':
                invokeCallback = true;
                break;
            case 'object':
                switch(children.$$typeof){
                    case REACT_ELEMENT_TYPE:
                    case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                }
        }
    }


    // 随后调用 cb
    if(invokeCallback){
        callback(
            '',
            children,
            nameSoFar === '' ? SEPARATOR + getComponentKey(children,0):nameSoFar,
        );
        return 1;
    }

    let child,nextName,subtreeCount=0;
    /* . - .test:a: */
    const nextNamePrefix = nameSoFar=== '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

    if(Array.isArray(children)){
        /* 递归遍历数组 children 及其 child */
        for(let i=0;i<children.length;i++){
            child = children [i];
            nextName = nextNamePrefix + getComponentKey(child,i);
            subtreeCount += traverseAllChildrenImpl(child,nextName,callback)
        }
    }else{
        /* 怎么从 children 拿迭代函数。。。 */
        const iteratorFn = getIteratorFn(children);
        /* iteratorFn 是否为 fn 分支 */
        if(typeof iteratorFn === 'function'){
            const iterator = iteratorFn.call(children);
            let step;
            let ii = 0;
            while(!(step = iterator.next()).done){
                child = step.value;
                nextName = nextNamePrefix = getComponentKey(child,ii++);
                subtreeCount += traverseAllChildrenImpl(child,nextName,callback,traverseContext)
            }
        }else if(type === 'object'){
            /* object are not valid as a react child */
            /* 这里是要输出 error 。。。 */

        }
        
        
    }

return subtreeCount
}

function traverseAllChildren(children:object,callback:object){
    if(children == null){
        return 0;
    }
    return traverseAllChildrenImpl(children,'',callback)
}



// --------

function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
    let escapedPrefix = '';
    if (prefix != null) {
      escapedPrefix = escapeUserProvidedKey(prefix) + '/';
    }
    const traverseContext = getPooledTraverseContext(
      array,
      escapedPrefix,
      func,
      context,
    );
    traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
    releaseTraverseContext(traverseContext);
  }
/* 非 api 函数 end */




/* 暴露的 api  start*/
function forEachChildren (children:any, forEachFunc:object, forEachContext:object){
    if(children == null){
        return children;
    }

    traverseAllChildren(children,forEachSigleChild);
}

function mapChildren(children, func, context):Array<any> {
    if (children == null) {
      return children;
    }
    const result = [];
    mapIntoWithKeyPrefixInternal(children, result, null, func, context);
    return result;
}

/* 暴露的 api  end*/


export {
    forEachChildren as forEach,
    mapChildren as map,
    countChildren as count,
    onlyChild as only,
    toArray,
}