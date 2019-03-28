// 使用这个 obj 是否所有 Component 都是用同一个对象做ref到初始值呢？
const emptyObject = {}; 
class Component {

    refs:object;
    constructor(public props:object,public context:object,public updater:object){
        this.refs = {};

        // 初始化默认的 updater，实际使用依靠 render。
        this.updater = updater || ReactNoopUpdateQueue;
    }

    isReactComponent(){

    }

    setState(partialState,callback){
        this.updater.enqueueSetState(this,partialState,callback,"setState")
    }

    forceUpdate(callback){
        this.updater.enqueueForceUpdate(this,callback,'forceUpdate');
    }
}

/* PureComponent 
* PureComponent 继承(的原型来自 Component
* 源码使用 道格拉斯空函数继承。
* Object.assign(pureComponentPrototype, Component.prototype);

 */

 export {Component}