import {ReactWork} from './ReactWork'
import {ReactBatch} from 'ReactBatch'

interface ReactRoot{
    render():ReactWork;
    unmount():ReactWork;
    legacy_renderSubtreeIntoContainer():ReactWork;
    createBatch():ReactBatch;
}
export class ReactRoot{
    constructor(container:DOMContainer,isConcurrent:boolean,hydrate:boolean){
        const root = createContainer(container,isConcurrent,hydrate);
        this._internalRoot = root
    }

    render(children:ReactNodeList,callback:any):ReactWork{
        const root = this._internalRoot;
        const work = new ReactWork();

        work.then(callback);
        updateContainer(children,root,null,work._onCommit)
        return work;
    }

    unmount(callback):ReactWork{
        const root = this._internalRoot;
        const work = new ReactWork();

        work.then(callback);
        updateContainer(null,root,null,work._onCommit);
        return work;
    }

    createBatch():Batch{
        const batch = new ReactBatch(this);
        const expirationTime = batch._expirationTime;

        const internalRoot = this._internalRoot;
        const firstBatch = internalRoot.firstBatch;


        if(firstBatch === null){
            internalRoot.firstBatch = batch;
            batch._next = null;
        }else{
            /* 按到期时间点顺序插入，并排序 
            * 当前创建的 batch 和 root.firstBatch 的过期时间对比，判断谁前谁后*/
            let insertAfter = null;
            let insertBefore = firstBatch;
            while(insertBefore._expirationTime >= expirationTime){
                insertAfter = insertBefore;
                insertBefore = insertBefore._next;
            }
            batch._next = insertBefore;
            if(insertAfter !== null){
                insertAfter._next = batch;
            }

        }
        return batch;
    }
}