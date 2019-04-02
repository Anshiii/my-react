import Mreact from '../src/index'

const {Component,render,createElement} = Mreact;
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

const a = <span>1</span>;

function funC (props:any):any{
  return createElement(
    "div",
    props,
    "funC ",
    props.title,
  )
}
const element = createElement(App, { name: "World" });
render(element, root);