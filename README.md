# my-react
a simple project from react source code to show how the react work 📖

基于(抄袭)[didact-fiber-incremental-reconciliation](https://engineering.hexacta.com/didact-fiber-incremental-reconciliation-b2fe028dcaec)实现的 react ，旨在理解 react(16.8.4) 源码，减少实际开发中遇到问题的可能，主要实现了渲染和更新，这里将补充我想知道的其他功能在react源码里的实现。


## reference
* [react](https://github.com/facebook/react/)
* [React-Fiber-Architecture](https://github.com/SaeedMalikx/React-Fiber-Architecture)
* [didact-fiber-incremental-reconciliation](https://engineering.hexacta.com/didact-fiber-incremental-reconciliation-b2fe028dcaec)
* [Under-the-hood-ReactJS](https://github.com/Bogdan-Lyashenko/Under-the-hood-ReactJS)

## Features
自带的功能点
- classComponent
- 基于 fiber 的 reconcile
- createElement （可配置 babel 后使用 jsx）
- 异步计算更新(使用 requestIdleCallback 调度任务)

## todo
- [x] key
- [x] fragment(用fragment包裹数组child，之前？)
- [x] functionComponent
- [ ] hooks
- [ ] setState 合并
- [ ] ref
- [ ] priorities
- [ ] events


### **[wiki](https://github.com/Anshiii/my-react/wiki/Contents)**
