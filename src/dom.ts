import { scheduleRender, Fiber } from "./reconciler";
import { element ,TEXT_ELEMENT} from "./element";

export declare type DOM = any;

export function render(element: element, container: DOM) {
  scheduleRender(element, container);
}

export function updateDomProperties(dom: DOM, lastProps: any, nextProps: any) {
  for (let propKey in lastProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    /* 是next没有的 props */

    /* 清除之前的 style */
    if (propKey === "style") {
      for (let styleName in lastProps[propKey]) {
        dom.style[styleName] = "";
      }
      continue;
    }

    /* 移除之前的事件监听,粗略的判断事件方法 onX 开头 */
    if (propKey.startsWith("on")) {
      /* 粗略判断 - 去除 on 后转为小写，就是 eventType */
      const eventType = propKey.substring(2).toLowerCase();
      dom.removeEventListener(eventType, lastProps[propKey]);
      continue;
    }

    /* 移除 dom attr，粗略- 非 style ，非事件 ，非 children 就是 attr */
    if (propKey !== "children") {
      dom[propKey] = null;
    }
  }

  /* next直接覆盖之前的值-或者相等。 */
  for (let propKey in nextProps) {
    if (lastProps[propKey] === nextProps[propKey]) {
      continue;
    }

    /* 更新 style */
    if (propKey === "style") {
      for (let styleName in nextProps[propKey]) {
        dom.style[styleName] = nextProps.style[styleName];
      }
      continue;
    }
    /* 更新 event */
    if (propKey.startsWith("on")) {
      /* 粗略判断 - 去除 on 后转为小写，就是 eventType */
      const eventType = propKey.substring(2).toLowerCase();
      dom.addEventListener(eventType, nextProps[propKey]);
      continue;
    }
    /* 更新 attr */
    if (propKey !== "children") {
      dom[propKey] = nextProps[propKey];
    }
  }
}

/* 创建的时候只创建父元素？ */
export function createDomElement(fiber: Fiber) {
  let domEle;
  switch (fiber.type) {
    case TEXT_ELEMENT:
      domEle = document.createTextNode(fiber.pendingProps.nodeValue);
      break;
    default:
      domEle = document.createElement(fiber.type);
  }
  /* 创建 dom 元素时还需要设置 prop */
  updateDomProperties(domEle, {}, fiber.pendingProps);
  return domEle;
}
