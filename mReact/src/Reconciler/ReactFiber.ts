import { createFiberRoot } from "./ReactFiberRoot";

export const NoContext = 0b000;
export const ConcurrentMode = 0b001;
export const StrictMode = 0b010;
export const ProfileMode = 0b100;

export function createHostRootFiber(isConcurrent: boolean):Fiber{
    let mode = isConcurrent ? ConcurrentMode | StrictMode : NoContext
    if(enableProfilerTimer && isDevToolsPresent){
        mode |= ProfileMode;
    }
    return createFiber(HostRoot,null,null,mode);
}

const createFiber = function(
    tag:WorkTag,
    pendingProps,
    key,
    mode
):Fiber{
    return new FiberNode(tag,pendingProps,key,mode)
}


/* Fiber 作用于需要被操作的组件或者已经操作的组件，每个组件可能不止一个 fiber。 */
class FiberNode {
    constructor(tag,pendingProps,key,mode){
        /* Instance */
        // 定义 fiber 类型
        this.tag = tag; 
        // 标识
        this.key = key;
        // 
        this.elementType = null;
        // fun/class with Fiber
        this.type = null;
        this.stateNode = null;

        /* Fiber */
        this.return = null;
        this.child = null;
        this.sibling = null;
        this.index = 0;

        //  ... 还有很多，我略过了
    }
}