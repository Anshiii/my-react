let isBatchingUpdates: boolean = false;
let isUnbatchingUpdates: boolean = false;
let isRendering: boolean = false;


/* 不批量更新，立即执行fn */
export function unbatchedUpdates(fn,a){
    if(isBatchingUpdates && !isUnbatchingUpdates){
        isUnbatchingUpdates = true;
        try{
            return fn(a);
        } finally{
            isUnbatchingUpdates = false;
        }
    }
    return fn(a);
}

/* 批量更新,这里只是定义变量。 */
export function batchedUpdates(fn,a){
    const previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try{
        return fn(a)
    }finally{
        isBatchingUpdates = previousIsBatchingUpdates;
        if(!isBatchingUpdates && !isRendering){
            performSyncWork();
        }
    }
}