
/* 创建 根元素。 */
function legacyCreateRootFromDOMContainer (
    container,
    forceHydrate
):Root{
    const shouldHydrate = false; // 来源另一个函数
    /* 根元素默认不异步 */
    const isConcurrent = false;
    return new ReactRoot(container,isConcurrent,shouldHydrate);
}


/* 初始挂载 和 update 的中转站

return 返回 外部根实例。*/
function legacyRenderSubtreeIntoContainer (
    parentComponent,
    children,
    container,
    forceHydrate,
    callback
){
    let root = container._reactRootContainer;

    /* 初始化挂载 */
    if(!root){
        root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
            container,
            forceHydrate
        )

        /* 初始挂载不应该走批量 */
        unbatchedUpdates(()=>{
            /* 初始挂载还有 父组件？ */
            if(parentComponent != null){
                root.legacy_renderSubtreeIntoContainer(
                    parentComponent,
                    children,
                    callback
                )
            }else{
                /* 初始挂载 没有父组件 是 root。 */
                root.render(children,callback);
            }
        })
    }else{
        // 非初始挂载 - update - 可能会走批量？
        if(parentComponent != null){
            root.legacy_renderSubtreeIntoContainer(
                parentComponent,
                children,
                callback
            )
        }else{
            root.render(children,callback)
        }

    }
    /* 获取外部实例 - - 内部实例 */
    return getPublicRootInstance(root._internalRoot);
}

const ReactDom = {
    /**
     *
     *
     * @param {*} element react element
     * @param {*} container dom元素
     * @param {*} callback
     */
    render(
        element,
        container,
        callback
    ){
        return legacyRenderSubtreeIntoContainer(
            null,
            element,
            container,
            false,
            callback
        )
    }
}


export default ReactDom;