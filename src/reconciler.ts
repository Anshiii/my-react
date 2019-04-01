import { createElement, element } from "./element";
import { createInstance, Component } from "./component";
import { DOM, createDomElement, updateDomProperties } from "./dom";

const { requestIdleCallback } = <any>window;

/* FIBER WORKTYPE */
export const FunctionComponent = 0;
export const ClassComponent = 1;
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;

/* FIBER effectTag */
export const Placement = /*             */ 0b000000000010;
export const Update = /*                */ 0b000000000100;
export const PlacementAndUpdate = /*    */ 0b000000000110;
export const Deletion = /*              */ 0b000000001000;

export declare type Fiber = {
  tag: number; //WORKTYPE
  key?: string;
  type: any;
  stateNode?: DOM | any; // 这个 fiber 相关的 dom？
  child?: Fiber;
  sibling?: Fiber;
  parent?: Fiber; // 源码没有 parent ？？？
  index?: number;
  alternate?: Fiber; //他之前替代的 old-tree 上的 fiber。
  effectTag?: number; // 执行的操作 替换-更新-删除-移动 - 含有该属性的 fiber 会额外记录
  effects?: Fiber[]; // 副作用fiber 集合？？？
  memoizedState?: any; // 用于输出的 state
  memoizedProps?: any; //旧的 props
  pendingProps?: any; // 新的 props
};

/* 更新来源,初次挂载和后续更新- dirtyQueue 的常量 */
const RENDER = "RENDER";
const SETSTATE = "SETSTATE";

declare type work = {
  // type:DELETION|REPLACE|UPDATE|MOVE
};

let dirtyQueue: any[] = [];
let nextUnitOfWork: Fiber;
let pendingCommit: Fiber;
// render 初次挂载
export function scheduleRender(elements: element, container: DOM): void {
  dirtyQueue.push({
    type: RENDER,
    container,
    nextProps: { children: elements }
  });

  requestIdleCallback(performWork);
}

// 后续更新,instance 是类组件的实例
export function scheduleUpdate(instance: Component, partialState: any): void {
  dirtyQueue.push({
    type: SETSTATE,
    instance,
    partialState
  });

  requestIdleCallback(performWork);
}

declare type IDLEDeadline = {
  timeRemaining: () => Number;
};

function performWork(deadline: IDLEDeadline) {
  workLoop(deadline);
  /*  */
  if (nextUnitOfWork || dirtyQueue.length > 0) {
    requestIdleCallback(performWork);
  }
}

function workLoop(deadline: IDLEDeadline) {
  if (!nextUnitOfWork) {
    setNextUnitOfWork();
  }
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

/* 从 update 创建的 fiber -- First fiber from.? */
function setNextUnitOfWork(): void {
  const update = dirtyQueue.shift();
  if (!update) return;
  if (update.partialState) {
    update.instance.__fiber.memoizedState = update.partialState;
  }

  /* @que  我不知道这里为什么要获取 root。 */
  const root =
    update.from == HostRoot
      ? update.dom._rootContainerFiber
      : getRoot(update.instance.__fiber); //同样instance是 setState 才有的 从 fiber 里找到 root。

  /* the root of a new wip tree。 qua root 但是 props 用子元素的。 */
  nextUnitOfWork = {
    tag: HostRoot,
    type:root.type, //@type
    stateNode: update.container || root.stateNode, //container 也只是 render 的 update 才有
    pendingProps: update.nextProps || root.props, // props 只有 来自 render 的 update 会传递
    alternate: root //旧的 root fiber
  };
}

function getRoot(fiber: Fiber) {
  let tem = fiber;
  while (tem){
    if (tem.parent) {
      tem = tem.parent;
    }else{
      return tem
    }
  }
    
}

/* 难道每次一点更新都是从头到尾的walk？ */
function performUnitOfWork(workInProgress: Fiber): Fiber | null {
  beginWork(workInProgress); // 执行后 wip 及其子节点 的 fiber 都创建好了。
  if (workInProgress.child) {
    return workInProgress.child; // 有子节点，说明子节点有需要更新的内容
  }

  /* 没有，说明子节点没有更新的内容，complete*/
  let tem = workInProgress;
  while (tem) {
    completeWork(workInProgress);
    if (tem.sibling) {
      return tem.sibling;
    }
    tem = tem.parent;
  }
}

/* */
function beginWork(workInProgress: Fiber) {
  if (workInProgress.tag === ClassComponent) {
    updateClassComponent(workInProgress);
  } else {
    updateHostComponent(workInProgress);
  }
}

function updateHostComponent(wipFiber: Fiber) {
  if (!wipFiber.stateNode) {
    wipFiber.stateNode = createDomElement(wipFiber);
  }
  const newChildElements = wipFiber.pendingProps.children;
  reconcileChildrenArray(wipFiber, newChildElements);
}

function updateClassComponent(wipFiber: Fiber) {
  let instance = wipFiber.stateNode;
  if (instance == null) {
    instance = wipFiber.stateNode = createInstance(wipFiber);
  } else if (
    instance.props == wipFiber.pendingProps &&
    !wipFiber.memoizedState
  ) {
    /* scu do */
    cloneChildFibers(wipFiber);
  }

  instance.props = wipFiber.pendingProps;
  instance.state = { ...instance.state, ...wipFiber.memoizedState };
  wipFiber.memoizedState = null;

  const newChildElements = wipFiber.stateNode.render();
  reconcileChildrenArray(wipFiber, newChildElements);
}

function cloneChildFibers(fiber:Fiber) {
  /* 因为有 alterstate 所以要新建 fiber node */
  const oldFiber = fiber.alternate;
  if(!oldFiber.child)return;

  let oldChild = oldFiber.child;
  fiber.child = oldChild;
  let prevFiber:Fiber;
  while(oldChild){
    const newFiber = {
      ...oldFiber,
      alternate:oldChild,
      parent:fiber
    }
    if(prevFiber){
      prevFiber.sibling = newFiber
    }else{
      fiber.child = newFiber;
    }
    oldChild = oldChild.sibling;
    prevFiber = newFiber;
  }
}

/* core 创建 children fiber。*/
function reconcileChildrenArray(wipFiber: Fiber, childElements: element[]) {
  /* 来自 class 的 elements 可能是 null、undefin、false */
  childElements = childElements.filter(item => item);
  let prevFiber: Fiber;
  childElements.forEach((ele, index) => {
    let newFiber;
    let oldFiber = prevFiber.alternate.sibling;
    let isSameType = oldFiber.type === ele.type;

    /* key值；直接遍历新的 key，旧的有一样的就移动 没有直接删除。  */
    // ele.props.key

    /* 相同类型 更新 */
    if (isSameType) {
      newFiber = {
        ...oldFiber,
        pendingProps: ele.props,
        parent: wipFiber, // 源码是 return -？
        alternate: oldFiber,
        effectTag: Update
      };
    }

    /* 不同类型替换,且现有类型有效 */
    if (!isSameType && ele) {
      newFiber = {
        type: ele.type,
        tag: typeof ele.type === "string" ? HostComponent : ClassComponent,
        pendingProps: ele.props,
        parent: wipFiber,
        effectTag: Placement
      };
    }

    if (!isSameType && oldFiber) {
      oldFiber.effectTag = Deletion;
      /*因为这个fiber 不在 wip tree 里，所以放在 effects 里？？哦吼？ */
      wipFiber.effects.push(oldFiber);
    }

    if (prevFiber) {
      prevFiber.sibling = newFiber;
    } else {
      wipFiber.child = newFiber; // 就指一个 child.
    }
    prevFiber = newFiber;
  });
}

function completeWork(fiber: Fiber) {
  /* 为什么要这样呢。 //TODE 写在别的地方 */
  if (fiber.tag == ClassComponent) {
    fiber.stateNode.__fiber = fiber;
  }

  if (fiber.parent) {
    // 父元素的 effects 储存着 effectTag 不为空值的 子元素。(还包括不在wip的fiber)
    const thisEffect = fiber.effectTag != null ? [fiber] : [];
    const childEffects = fiber.effects || [];
    const parentEffects = fiber.parent.effects || [];

    fiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
  } else {
    /* root ,计算了和收集。 */
    pendingCommit = fiber;
  }
}

/* 更新 DOM */
function commitAllWork(fiber: Fiber) {
  /* 所有 effectTage fiber */
  fiber.effects.forEach(f => {
    commitWork(f);
  });
  /* root 的stateNode 携带 fiber 信息指针_rootContainerFiber */
  fiber.stateNode._rootContainerFiber = fiber;
  nextUnitOfWork = null;
  pendingCommit = null;
}

function commitWork(fiber: Fiber) {
  if (fiber.tag == HostRoot) {
    return; //????@que 这是在做啥
  }

  /* yyyy??? */
  let domParentFiber = fiber.parent;
  while (domParentFiber.tag == ClassComponent) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.stateNode;
  let dom = fiber.stateNode;

  switch (fiber.effectTag) {
    case Placement:
      if (fiber.tag == HostComponent) {
        // ???@que 为啥
        fiber.parent.stateNode.appen;
      }
    case Update:
      updateDomProperties(dom, fiber.memoizedProps, fiber.pendingProps);
      break;
    case Deletion:
      commitDeletion(domParent, fiber);
  }
}

function commitDeletion(parent: DOM, fiber: Fiber) {
  /* classComponent 到底与什么不一样呢。*/
  let node = fiber;
  while (true) {
    if (node.tag == ClassComponent) {
      node = node.child;
      continue;
    }
    parent.removeChild(node.stateNode);
    while (node != fiber && !node.sibling) {
      node = node.parent;
    }
    if (node == fiber) {
      return;
    }
    node = node.sibling;
  }
}

