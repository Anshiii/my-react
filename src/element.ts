import { Component } from "./component";

declare type TEXT_ELEMENT = string;

export const TEXT_ELEMENT = "TEXT ELEMENT";
export declare type element = {
  type: string | Function | Component |TEXT_ELEMENT;
  props: object;
};

export function createElement(
  type: string | Function | Component,
  config: object,
  ...children: element[]
): element {
  /* 过滤 null - undefined 的子元素 */
  const rawChildren = children.filter((item: element) => item != null);
  return {
    type,
    props: {
      ...config,
      children:rawChildren
    }
  };
}

/* 创建文本 element */
function createTextElement(value: string): element {
  return createElement(TEXT_ELEMENT, { nodeValue: value });
}


/* 这里的方法是 jsx 调用。（哦吼？） */