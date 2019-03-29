import { createElement } from "./element";
import { createInstance } from "./component";

// Fiber tags
const HOST_COMPONENT = "host";
const CLASS_COMPONENT = "class";
const HOST_ROOT = "root";

// Effect tags
const PLACEMENT = 1;
const DELETION = 2;
const UPDATE = 3;

const ENOUGH_TIME = 1;

// Global state
const updateQueue = [];
let nextUnitOfWork = null;
let pendingCommit = null;

// render 初次挂载
export function render(elements, containerDom): void {
  updateQueue.push({
    from: HOST_ROOT,
    dom: containerDom,
    newProps: { children: elements }
  });

  requestIdleCallback(performWork);
}

// 后续更新,instance 是类组件的实例
export function scheduleUpdate(instance, partialState): void {
  updateQueue.push({
    from: CLASS_COMPONENT,
    instance,
    partialState
  });

  requestIdleCallback(performWork);
}

// 传递给 idleCB 的回调函数
function performWork(): void {
  workLoop(deadline);
  if (nextUnitOfWork || updateQueue.length > 0) {
    requestIdleCallback(performWork);
  }
}

// 任务循环- nextUnitOfWork 存在就会一直执行下去
function workLoop(deadline): void {
  if (!nextUnitOfWork) {
    resetNextUnitOfWork();
  }
  while (nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  if (pendingCommit) {
    commitAllWork(pendingCommit);
  }
}

function resetNextUnitOfWork(): void {
  const update = updateQueue.shift();
  if (!update) {
    return;
  }

  /* 有 partialState 的更新是 setState 引起的更新*/
  if (update.partialState) {
    update.instance._fiber.partialState = update.partialState;
  }

  const root =
    update.from == HOST_ROOT
      ? update.dom._rooContainerFiber
      : getRoot(update.instance.__fiber);

  /* 这是个 fiber 呢。 是后文的 fiber */
  nextUnitOfWork = {
    tag: HOST_ROOT,
    stateNode: update.dom || root.stateNode,
    props: update.newProps || root.props,
    alternate: root
  };
}

/* 找到 fiber 节点的顶级 root 节点。 */
function getRoot(fiber): Fiber {
  let node = fiber;
  while (node.parent) {
    node = node.parent;
  }
  return node;
}

/* wipFiber  work-in-progress  fiber ; 实例要更新-其子组件都得更新啦*/
function performUnitOfWork(wipFiber) {
  beginWork(wipFiber);
  if (wipFiber.child) {
    return wipFiber.child;
  }

  //   深度遍历树来完成 work

  /* 无子节点,最末端的节点逐步打上 complete 的标签。 */
  let uow = wipFiber;
  while (uow) {
    completeWork(uow);
    if (uow.sibling) {
      return uow.sibling;
    }
    uow = uow.parent;
  }
}

function beginWork(wipFiber): void {
  if (wipFiber.tag == CLASS_COMPONENT) {
    uodateClassComponent(wipFiber);
  } else {
    uodateHostComponent(wipFiber);
  }
}

/* 更新 dom 组件 */
function updateHostComponent(wipFiber): void {
  // @q fiber怎么会没有 stateNode
  if (!wipFiber.stateNode) {
    wipFiber.stateNode = createDomElement(wipFiber);
  }

  /* 非 class 组件 children 已经准备好了。 */
  const newChildElements = wipFiber.props.children;
  reconcileChildrenArray(wipFiber, newChildElements);
}

function updateClassComponent(wipFiber) {
  let instance = wipFiber.stateNode;
  if (instance === null) {
    instance = wipFiber.stateNode = createInstance(wipFiber);
  } else if (wipFiber.props == instance.props && !wipFiber.partialState) {
    /* 无 props 和 state 的更新， 复用旧的fiber？ */
    cloneChildFibers(wipFiber);
    return;
  }
  instance.props = wipFiber.props;
  instance.state = { ...instance.state, ...wipFiber.partialState };
  wipFiber.partialState = null;

  /* 调用 实例的 render  获得 element tree。 */
  const newChildElements = wipFiber.stateNode.render();
  reconcileChildrenArry(wipFiber, newChildElements);
}

/* 生成新的 fiber 节点，这里是处理 子节点的。 */
function reconcileChildrenArry(wipFiber, newChildElements): void {
  const elements = arrify(newChildElements); // 数组化

  let index = 0;
  // @q 为什么 oldFiber 是子节点呢
  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  let newFiber = null;

  while (index < elements.length || oldFiber != null) {
    const prevFiber = newFiber;
    /* 存在子元素 */
    const element = index < elements.length && elements[index];
    // 新旧Fiber 拥有同样的 type - 标签名。
    const sameType = oldFiber && element && element.type == oldFiber.type;

    // TODO 引入 key 的优化。
    /* 如果相同类型，直接用旧 fiber 的大部分内容，- partialState？ */
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        tag: oldFiber.tag,
        stateNode: oldFiber.stateNode,
        props: element.props,
        parent: wipFiber,
        alternate: oldFiber,
        partialState: oldFiber.partialState,
        effectTag: UPDATE
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        tag:
          typeof element.type === "string" ? HOST_COMPONENT : CLASS_COMPONENT,
        props: element.props,
        parent: wipFiber,
        effectTag: PLACEMENT
      };
    }

    /* 延续的操作 */
    if (oldFiber && !sameType) {
      /* DEL 的更新 */
      oldFiber.effectTag = DELETION;
      wipFiber.effects = wipFiber.effects || [];
      wipFiber.effects.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index == 0) {
      wipFiber.child = newFiber;
    } else if (prevFiber && element) {
      // 这里的 prevFiber 是上一个 while 循环内的 newFiber
      prevFiber.sibling = newFiber;
    }
  }
}

/* 复制 fiber 的子节点 */
function cloneChildFibers(parentFiber) {
  const oldFiber = parentFiber.alternate;
  /* 没有子节点 不用复制 */
  if (!oldFiber.child) {
    return;
  }

  let oldChild = oldFiber.child;
  let prevChild = null;
  while (oldChild) {
    const newChild = {
      tag: oldChild.tag,
      type: oldChild.type,
      stateNode: oldChild.stateNode,
      props: oldChild.props,
      partialState: oldChild.partialState,
      alternate: oldChild, // 新旧fiber 的指针链接
      parent: parentFiber
    };
    if(prevChild){
        prevChild.sibling = newChild;
    }else{
        parentFiber.child = newChild
    }
    prevChild = newChild;
    oldChild = oldChild.sibling;  // 这个应该本来就是如此吧。
  }
}

/* fiber 的工作完成咯✅ */
function completeWork(fiber) {
  if (fiber.tag == CLASS_COMPONENT) {
    fiber.stateNode.__fiber = fiber;
  }

  if (fiber.parent) {
    const childEffects = fiber.effects || [];
    const thisEffect = fiber.effectTag != null ? [fiber] : [];
    const parentEffects = fiber.parent.effects || [];
    fiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
  } else {
    //   根节点 pendingCommit；
    pendingCommit = fiber;
  }
}

function commitAllWork():void{
    fiber.effects.forEach(f => {
        commitWork(f);
    });
    fiber.stateNode._rootContainerFiber = fiber;
    nextUnitOfWork = null;
    pendingCommit
}
