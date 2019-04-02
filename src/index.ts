import { createElement } from "./element";
import { Component } from "./component";
import { render } from "./dom";

export default {
  createElement,
  Component,
  render
};

// export { createElement, Component, render };

/* EXAMPLE */
const root = document.getElementById("root");
class App extends Component {
  state = {
    name: " !"
  };

  click = () => {
    this.setState({
      name: "???~"
    });
  };

  render() {
    return createElement(
      "div",
      {
        onClick: this.click
      },
      "Hello ",
      this.props.name,
      this.state.name
    );
  }
}
const element = createElement(App, { name: "World" });
render(element, root);
