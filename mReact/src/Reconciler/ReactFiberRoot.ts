export function createFiberRoot(
    containerInfo:any,
    isConcurrent: boolean,
  hydrate: boolean,
):FiberRoot{
    const uninitializedFiber = createHostRootFiber(isConcurrent);

    let root;
    root = {
        current:uninitializedFiber,
        containerInfo,
        // ... 很多
        interactionThreadID: unstable_getThreadId(),
        memoizedInteractions: new Set(),
        pendingInteractionMap: new Map(),
    }
    uninitializedFiber.stateNode = root;
    return uninitializedFiber;
}