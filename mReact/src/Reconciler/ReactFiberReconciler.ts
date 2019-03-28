export function updateContainer(
    element:ReactNodeList,
    container:OpaqueRoot,
    parentComponent:?React$Component,
    callback:?Function,
):ExpirationTime{
    const current = container.current;
    const currentTime = requestCurrentTime();
    const expirationTime = computeExpirationForFiber(currentTime,current);
    return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        expirationTime,
        callback
    )
}

/* container 是个 fiber */
export function createContainer(
    containerInfo:ServiceWorkerContainer,
    isConcurrent:boolean,
    hydrate:boolean,
):OpaueRoot{
    return createFiberRoot(containerInfo,isConcurrent,hydrate);
}

export function getPublicRootInstance(container:OpaueRoot):React$Component|PublicInstance|null{
    const containerFiber = container.current;
    if(!containerFiber.child){
        return null;
    }
    switch(containerFinber.child.tag){
        case HostComponent:
        return getPublicRootInstance(containerFinber.child.stateNode); //渲染器控制
        default:
        return containerFiber.child.stateNode;
    }
}


export function updateContainerAtExpirationTime(
    element:ReactNodeList,
    container:OpaueRoot,
    parentComponent:?ReactComponent,
    expirationTime:ExpirationTime,
    callback:?Function,
){
    const current = container.current;
    const context = getContextForSubtree(parentComponent);
    if(container.context === null){
        container.context = context;
    }else{
        container.pendingContext = context;
    }
    return scheduleRootUpdate(current,element,expirationTime,callback);
}