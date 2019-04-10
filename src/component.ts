import { scheduleUpdate } from "./reconciler";
export class Component {
  state: any;
  static isReactComponent:boolean = true
  constructor(public props: any) {}

  setState(partialState: object) {
    scheduleUpdate(this, partialState);
  }
}

export function createInstance(fiber: Fiber) {
  const instance = new fiber.type(fiber.pendingProps);
  instance.__fiber = fiber; // 实例和 fiber 连接了。
  return instance;
}
