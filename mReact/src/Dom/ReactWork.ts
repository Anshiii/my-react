interface ReactWork{
  then():void; //向 work 的 callbacks 里添加任务
  _onCommit():void; //该方法，意味 work 生命周期的结束，他将遍历 callbacks 依次执行
}

export class ReactWork {
  constructor() {
    this._callbacks = null;
    this._didCommit = false;
  }

  /* 给 this._callback 添加队列。 */
  then(onCommit): void {
    if (this._didCommit) {
      this._onCommit();
      return;
    }
    let callbacks = this._callbacks;
    if (callbacks === null) {
      callbacks = this._callbacks = [];
    }

    callbacks.push(onCommit);
  }

  _onCommit = (): void => {
    if (this._didCommit) {
        return;
    }
    this._didCommit = true;
    const callbacks = this._callbacks;
    if(callbacks === null){
        return;
    }
    for(let i=0;i<callbacks.length;i++){
        const callback = callbacks[i];
        callback();
    }
  };
}
