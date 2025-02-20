import React, { Component } from "react";
import { t } from "../Functions";

class ToastComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      heading: "",
      message: "",
      type: "",
      shown: false,
    };
    this.toastInstance = null;
  }

  componentDidMount() {
    const toast = document.getElementById("toast");

    if (toast) {
      toast.addEventListener("hidden.bs.toast", this.handleToastHidden);
      this.toastInstance = new bootstrap.Toast(toast);
    }
  }

  componentWillUnmount() {
    const toast = document.getElementById("toast");

    if (toast) {
      toast.removeEventListener("hidden.bs.toast", this.handleToastHidden);
    }
  }

  handleToastHidden = () => {
    this.setState({
      heading: "",
      message: "",
      type: "",
      shown: false,
    });
  };

  show = (heading, message, type) => {
    this.setState({
      heading: heading,
      message: message,
      type: type,
      shown: true,
    });

    if (this.toastInstance) {
      this.toastInstance.show();
    }
  };

  componentDidUpdate() {
    const toast = document.getElementById("toast");
    if (this.state.type === "" || this.state.type === undefined) {
      return;
    } else {
      const classList = toast.classList;
      classList.forEach((cssClass) => {
        if (cssClass.startsWith("text-bg-")) {
          toast.classList.remove(cssClass);
        }
      });
      toast.classList.add(`text-bg-${this.state.type}`);
    }
  }

  render() {
    return (
      <div className="toast position-fixed" style={{ top: "1rem", right: "1rem" }} id="toast" role="alert">
        <div className="toast-header">
          <strong className="me-auto">{t(this.state.heading, this.props.lang)}</strong>
          <small>{t(this.props.time, this.props.lang)}</small>
          <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div className="toast-body">{t(this.state.message, this.props.lang)}</div>
      </div>
    );
  }
}

export default ToastComponent;
