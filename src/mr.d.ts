type Fiber = {
    tag: number; //WORKTYPE
    key?: string | number; // 对比时的辅助值
    type?: any; //function|class|string
    stateNode?: HTMLElement | any; // 这个 fiber 相关的 dom？
    child?: Fiber;
    sibling?: Fiber;
    return?: Fiber; // 源码没有 return ？？？
    index?: number; // fiberChildren 下标
    alternate?: Fiber; //他之前替代的 old-tree 上的 fiber。
    effectTag?: number; // 执行的操作 替换-更新-删除-移动 - 含有该属性的 fiber 会额外记录
    effects?: Fiber[]; // 副作用fiber 集合？？？
    memoizedState?: any; // 用于输出的 state
    memoizedProps?: any; //旧的 props
    pendingProps?: any; // 新的 props
};


type element = {
    type: any;
    props: object;
    key?: string | number;
};

declare type IDLEDeadline = {
    timeRemaining: () => Number;
};