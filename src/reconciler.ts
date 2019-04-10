import { createTextElement, REACT_FRAGMENT_TYPE } from "./element";
import { createInstance, Component } from "./component";
import { createDomElement, updateDomProperties } from "./dom";

const { requestIdleCallback } = <any>window;

/* FIBER tag WORKTYPE */
export const FunctionComponent = 0;
export const ClassComponent = 1;
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const Fragment = 7;

/* FIBER effectTag */
export const Placement = /*             */ 0b000000000010; //2
export const Update = /*                */ 0b000000000100; //4
export const PlacementAndUpdate = /*    */ 0b000000000110; //5
export const Deletion = /*              */ 0b000000001000; //8



let dirtyQueue: any[] = [];
let nextUnitOfWork: Fiber;
let pendingCommit: Fiber;
// render 初次挂载
export function scheduleRender(elements: element, container: HTMLElement): void {
  dirtyQueue.push({
    type: HostRoot,
    container,
    nextProps: { children: elements }
  });

  requestIdleCallback(performWork);
}

// 后续更新,instance 是类组件的实例
export function scheduleUpdate(instance: Component, partialState: any): void {
  dirtyQueue.push({
    type: ClassComponent,
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
  if (pendingCommit) {
    commitAllWork(pendingCommit);
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
    update.type == HostRoot
      ? update.container._rootContainerFiber
      : getRoot(update.instance.__fiber); //同样instance是 setState 才有的 从 fiber 里找到 root。

  /* the root of a new wip tree。 qua root 但是 props 用子元素的。 */
  nextUnitOfWork = {
    key: "root",
    tag: HostRoot,
    stateNode: update.container || root.stateNode, //container 也只是 render 的 update 才有
    pendingProps: update.nextProps || root.pendingProps, // props 只有 来自 render 的 update 会传递
    alternate: root //旧的 root fiber
  };
}

function getRoot(fiber: Fiber) {
  let tem = fiber;
  while (tem) {
    if (tem.return) {
      tem = tem.return;
    } else {
      return tem;
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
    completeWork(tem);
    if (tem.sibling) {
      return tem.sibling;
    }
    tem = tem.return;
  }
}

/* */
function beginWork(workInProgress: Fiber) {
  switch (workInProgress.tag) {
    case ClassComponent:
      updateClassComponent(workInProgress);
      break;
    case FunctionComponent:
      updateFunctionComponent(workInProgress);
      break;
    case Fragment:
      updateFragmentComponent(workInProgress);
      break;
    default:
      updateHostComponent(workInProgress);
  }
}

function updateFragmentComponent(wipFiber: Fiber): void {
  const newChildElements = wipFiber.pendingProps.children;
  reconcileChildrenArray(wipFiber, newChildElements);
}

function updateFunctionComponent(wipFiber: Fiber) {
  let component = wipFiber.type(wipFiber.pendingProps);
  reconcileChildrenArray(wipFiber, component);
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

function cloneChildFibers(fiber: Fiber) {
  /* 因为有  所以要新建 fiber node */
  const oldFiber = fiber.alternate;
  if (!oldFiber.child) return;

  let oldChild = oldFiber.child;
  fiber.child = oldChild;
  let prevFiber: Fiber;
  while (oldChild) {
    const newFiber = {
      ...oldFiber,
      alternate: oldChild,
      return: fiber
    };
    if (prevFiber) {
      prevFiber.sibling = newFiber;
    } else {
      fiber.child = newFiber;
    }
    oldChild = oldChild.sibling;
    prevFiber = newFiber;
  }
}

/* core 创建 children fiber。*/
function reconcileChildrenArray(
  wipFiber: Fiber,
  childElements: element[]
): void {
  /* 来自 class 的 elements 可能是 null、undefin、false */
  let arrayChild = Array.isArray(childElements)
    ? childElements
    : [childElements];

  arrayChild = arrayChild.filter(item => item);

  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  let newFiber: Fiber;
  arrayChild.forEach((ele, index) => {
    if (typeof ele === "string") {
      ele = createTextElement(ele);
    }

    if (Array.isArray(ele)) {
      ele = {
        type: "Fragment",
        props: { children: [...ele] }
      };
    }

    const prevFiber = newFiber;
    const isSameType = oldFiber && ele && ele.type == oldFiber.type;

    /* 相同类型 更新- ele 肯定也存在 */
    if (isSameType) {
      newFiber = {
        type: oldFiber.type,
        tag: oldFiber.tag,
        stateNode: oldFiber.stateNode,
        pendingProps: ele.props,
        memoizedState: oldFiber.memoizedState,
        return: wipFiber, // 源码是 return
        alternate: oldFiber,
        effectTag: Update,
        index
      };
    }

    /* 不同类型替换,且 ele 存在 */
    if (!isSameType && ele) {
      /* setTag */
      let tag = HostComponent;
      switch (typeof ele.type) {
        case 'symbol':
          if (ele.type === REACT_FRAGMENT_TYPE) {
            tag = Fragment;
          }
          /* ele.type 的typeof 怎么是 symbol + function */
          break;
        case "function":
          if (ele.type.isReactComponent) {
            tag = ClassComponent;
          } else {
            tag = FunctionComponent;
          }
          break;
      }

      newFiber = {
        type: ele.type,
        tag,
        pendingProps: ele.props,
        return: wipFiber,
        effectTag: Placement,
        index
      };
    }

    if (!isSameType && oldFiber) {
      oldFiber.effectTag = Deletion;
      /*因为这个fiber 不在 wip tree 里，所以放在 effects 里 */
      wipFiber.effects = wipFiber.effects || [];
      wipFiber.effects.push(oldFiber);
    }

    if (oldFiber) {
      /* 变成新的 old*/
      oldFiber = oldFiber.sibling;
    }

    if (index == 0) {
      wipFiber.child = newFiber;
    } else if (prevFiber && ele) {
      prevFiber.sibling = newFiber;
    }
  });
}

function completeWork(workInProgress: Fiber) {
  /* for what? */
  switch (workInProgress.tag) {
    case FunctionComponent:
      break;
    case ClassComponent:
      workInProgress.stateNode.__fiber = workInProgress;
  }

  if (workInProgress.return) {
    // 父元素的 effects 储存着 effectTag 不为空值的 子元素。(还包括不在wip的fiber-被del的)
    const thisEffect = workInProgress.effectTag != null ? [workInProgress] : [];
    const childEffects = workInProgress.effects || [];
    const parentEffects = workInProgress.return.effects || [];

    workInProgress.return.effects = parentEffects.concat(
      thisEffect,
      childEffects
    );
  } else {
    /* root ,计算了和收集。 */
    pendingCommit = workInProgress;
  }
}

/* 更新 DOM */
function commitAllWork(fiber: Fiber) {
  /* 所有 effectTage fiber */
  console.log(fiber.effects);
  fiber.effects &&
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
    return; // @que？根元素的改动直接无视-
  }

  /* 函数组件和class组件到底是什么样的存在？
  - fiber 对应的结构是存在的,但是没有dom结构
  - 更新，主要是更新 child , updateXX 本身不存在更新操作；
  - 删除，组件及子元素都将取消 这个时候render应该都不需要做的，但是没有提现？
  - 移动，fiber 的移动， dom移动。
  - 替换（新增+删除），只需新增，对于非dom节点无需操作
   */
  let domParentFiber = fiber.return;
  while (
    [ClassComponent, FunctionComponent, Fragment].includes(domParentFiber.tag)
  ) {
    // 上层遍历至包含 dom 的fiber
    domParentFiber = domParentFiber.return;
  }
  const domParent = domParentFiber.stateNode;
  const dom = fiber.stateNode;

  switch (fiber.effectTag) {
    case Placement:
      /* 非 host 组件新增在dom没有体现。 */
      if (fiber.tag == HostComponent) {
        // ???@que 为啥
        domParent.appendChild(dom);
      }
      break;
    case Update:
      /* 非 host 组件更新在dom没有体现。 */
      updateDomProperties(dom, fiber.memoizedProps, fiber.pendingProps);
      break;
    case Deletion:
      commitDeletion(domParent, fiber);
      break;
  }
}

function commitDeletion(parentDom: HTMLElement, fiber: Fiber) {
  /* class 和 func 组件的删除操作是子dom节点的删除 */
  let node = fiber;
  while (true) {
    /* 寻找 child dom 循环 */
    if ([ClassComponent, FunctionComponent, Fragment].includes(node.tag)) {
      node = node.child;
      continue;
    }
    if (node.stateNode) {
      parentDom.removeChild(node.stateNode);
    }

    /* 只删除 子一代的节点。 */
    while (node != fiber && !node.sibling) {
      node = node.return;
    }
    if (node == fiber) {
      return;
    }
    node = node.sibling;
  }
}

/* 记录 key 与 组件映射 */
function mapRemainingChildren(
  returnFiber: Fiber,
  currentFirstChild: Fiber
): Map<string | number, Fiber> {
  const existingChildren: Map<string | number, Fiber> = new Map();
  let existingChild = currentFirstChild;

  /* 遍历 child 及其 sibling，记录在 map 里 */
  while (existingChild !== null) {
    if (existingChild.key !== null) {
      existingChildren.set(existingChild.key, existingChild);
    } else {
      /* 原来 index 是这么用的 */
      existingChildren.set(existingChild.index, existingChild);
    }
    existingChild = existingChild.sibling;
  }
  return existingChildren;
}

/* 获取更新后的 fiber */
function updateFromMap(
  existingChildren: Map<string | number, Fiber>,
  returnFiber: Fiber,
  newIdx: number,
  newChild: any
): Fiber {
  /*  */
  if (typeof newChild === "string" || typeof newChild === "number") {
    const matchedFiber = existingChildren.get(newIdx) || null;
    //  update TextNode
    /* 
    updateTextNode(
        returnFiber,
        matchedFiber,
        '' + newChild,
        expirationTime,
      ) */
  }
  if (typeof newChild === "object" && newChild !== null) {
    const matchedFiber =
      existingChildren.get(newChild.key === null ? newIdx : newChild.key) ||
      null;

    /* 
    updateElement(
            returnFiber,
            matchedFiber,
            newChild,
            expirationTime,
          ) */
  }
  return returnFiber;
}
