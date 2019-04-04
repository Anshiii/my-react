import { Component } from "./component";

export const TEXT_ELEMENT = "TEXT ELEMENT";

export declare type element = {
  type: any;
  props: object;
};

export function createElement(
  type: string | Function | Component,
  config: object,
  children?: any
): element {
  /* 过滤 null - undefined 的子元素 */
  const props: any = { ...config };
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1 && children != null) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  /* 源码在createFiber 时处理 hostTEXT */

  return {
    type,
    props
  };
}

/* 创建文本 element */
export function createTextElement(value: string): element {
  return createElement(TEXT_ELEMENT, { nodeValue: value });
}

/* 这里的方法是 jsx 调用。（哦吼？） */
