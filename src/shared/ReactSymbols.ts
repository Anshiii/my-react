
// symbol 用于 类 reactelement 类型的标签，如果不存在 symbol 或者 polyfill，则用 number 替代。
export const REACT_ELEMENT_TYPE = Symbol.for('react.element')
export const REACT_PORTAL_TYPE= Symbol.for('react.portal');

const MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
export function  getIteratorFn (maybeIterable:?any):object{
    if(maybeIterable === null || typeof maybeIterable !== 'object'){
        return null;
    }
    const maybeIterator = maybeIterable[MAYBE_ITERATOR_SYMBOL]
    /* maybeIterable 存在一个作为 的 iterator_symbol 的迭代函数 ,
    存在则返回 否则 返回 null*/
}