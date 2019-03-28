import { ReactWork } from "./ReactWork";


interface ReactBatch{
    render(children:ReactNodeList):ReactWork; // 设置 children，调用 update 相关
    then():void; // callback 添加任务吧
    commit():void; // 提交 batch，将 batch 推送到更新 list 的最前？
    _onComplete():void; // 遍历执行完所有 callba

}
/* react 批量处理-- 处理 batch  */
export class ReactBatch {
    constructor(root:ReactRoot){
        const expirationTime = computeUniqueAsyncExpiration();
        this._expirationTime = expirationTime;
        this._root = root;
        this._next = null;
        this._callbacks = null;
        this._didComplete = false;
        this._hasChildren = false;
        this._children = null;
        this._defer = true;
    }

    /* 启动任务。 */
    render(children:ReactNodeList):ReactWork{
        this._hasChildren = true;
        this._children = children;
        const internalRoot = this._root._internalRoot;
        const expirationTime  = this._expirationTime;
        const work = new ReactWork();
        updateContainerAtExpirationTime(
            children,
            internalRoot,
            null,
            expirationTime,
            work._onCommit
        )
        return work;
    }

    then(onComplete):void{
        if(this._didComplete){
            onComplete();
            return;
        }
        let callbacks = this._callbacks;
        if(callbacks === null){
            callbacks = this._callbacks = [];
        }
        callbacks.push(onComplete);
    }

    /* commit 提交 batch？把 batch 放到最前？ */
    commit():void{
        const internalRoot = this._root._internalRoot;
        let firstBatch = internalRoot.firstBatch;
        if(!this._hasChildren){
            /* batch 为空，return */
            this._next = null;
            this._defer = false;
            return;
        }

        let expirationTime = this._expirationTime;
        /* 确保这是列表中的第一个batch */
        if(firstBatch !== this){
            // this  batch 不是最早的 batch，需要向前移动它。
            //更新它的过期时间成为最早的batch点过期时间，以至于我们能在不更新其他 batch 时更新它
            if(this._hasChildren){
                expirationTime = this._expirationTime = firstBatch._expirationTime;
                this.render(this._children)
            }

            /* 从列表中移出这个 batch */
            let previous = null;
            let batch = firstBatch;
            while( batch !== this){
                previous = batch;
                batch = batch._next;
            }

            previous._next = batch._next;
            this._next = firstBatch;
            firstBatch = internalRoot.firstBatch = thisl
        }
        /* 同步的使所有的 work 上升到 这个 batch 的过期时间内。*/
        this._defer = false;
        flushRoot(internalRoot,expirationTime);

        /* 从链表中弹出这个 batch */
        const next = this._next;
        this._next = null;
        firstBatch = internalRoot.firstBatch = next;

        // 将下一个最早的 batch 的子元素放到 update queue；
        if(firstBatch !== null && firstBatch._hasChildren){
            firstBatch.render(firstBatch._children);
        }
    }

    _onComplete ():void{
        if(this._didComplete){
            return;
        }
        this._didComplete = true;
        const callbacks = this._callbacks;
        if(callbacks === null){
            return;
        }

        for(let i =0 ;i<callbacks.length;i++){
            const callback = callbacks[i];
            callback();
        }
    }
}