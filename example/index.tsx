import React from "../src/index";

const { Component, render,createElement } = React;
/* EXAMPLE */
const root = document.getElementById("root");

const data = [
  { name: "a1", age: "32" },
  { name: "a2", age: "33" },
  { name: "a3", age: "12" },
  { name: "a4", age: "12" },
  { name: "a5", age: "12" },
];
class App extends Component {
  state = {
    title: " !",
    data,
  };

  click = () => {
    this.setState({
      data: [
        { name: "a1", age: "12" },
        { name: "a9", age: "12" },
        { name: "a3", age: "32" },
      ]
    });
  };

  render() {
    const { data } = this.state;
    return (
      <div onClick={this.click}>
        <p>121</p>
        {data.map(item => <div key={item.name}>{item.name}</div>)}
      </div>
    );
  }
}

function FuncCom(props: any): any {
  return <div>{props.title}</div>;
}
render(<App title="类组件" />, root);
