import { createElement } from "./element";
import { Component } from "./component";
import { render } from "./dom";

export default {
  createElement,
  Component,
  render
};

const root = document.getElementById("root");
class App extends Component {
  render() {
    return createElement("div", null, "Hello ",this.props.name,' !');
  }
}
const element = createElement(App, { name: "World" });
render(element, root);

// export { createElement, Component, render };
