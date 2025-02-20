import React, { Component } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../FirebaseConfig";
import { emailValidation, showPassword, t } from "../Functions";
import ToastComponent from "../components/ToastComponent";
import ProblemsModal from "../components/ProblemsModal";
import ClubList from "../components/ClubList";
import "../styles/Auth.scss";

class Auth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      form: "logInForm",
      userErrorText: "",
      passwordErrorText: "",
      toastHeading: "",
      toastMessage: "",
      toastType: "",
    };
  }

  createAccount = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, document.getElementById("emailInputCreateAccount").value, document.getElementById("passwordInputCreateAccount").value);
    } catch (error) {
      if (error.code == "auth/email-already-in-use") {
        document.getElementById("emailInputCreateAccount").classList.add("is-invalid");
        document.getElementById("emailInputCreateAccount").classList.remove("is-valid");
        this.setState({ userErrorText: t("email_already_in_use", this.props.lang) });
      } else if (error.code == "auth/invalid-email") {
        document.getElementById("emailInputCreateAccount").classList.add("is-invalid");
        document.getElementById("emailInputCreateAccount").classList.remove("is-valid");
        this.setState({ userErrorText: t("invalid_email", this.props.lang) });
      } else if (error.code == "auth/weak-password") {
        document.getElementById("passwordInputCreateAccount").classList.add("is-invalid");
        document.getElementById("passwordInputCreateAccount").classList.remove("is-valid");
        this.setState({ passwordErrorText: t("weak_password", this.props.lang) });
      }
      console.error(error);
    }
  };

  logIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, document.getElementById("emailInputLogIn").value, document.getElementById("passwordInputLogIn").value);
    } catch (error) {
      if (error.code == "auth/user-not-found") {
        document.getElementById("emailInputLogIn").classList.add("is-invalid");
        document.getElementById("emailInputLogIn").classList.remove("is-valid");
        this.setState({ userErrorText: t("user_not_found", this.props.lang) });
      } else if (error.code == "auth/wrong-password") {
        document.getElementById("emailInputLogIn").classList.remove("is-invalid");
        document.getElementById("passwordInputLogIn").classList.add("is-invalid");
        document.getElementById("passwordInputLogIn").classList.remove("is-valid");
        this.setState({ passwordErrorText: t("wrong_password", this.props.lang) });
      } else if (error.code == "auth/too-many-requests") {
        document.getElementById("emailInputLogIn").classList.add("is-invalid");
        document.getElementById("emailInputLogIn").classList.remove("is-valid");
        this.setState({ userErrorText: t("too_many_requests", this.props.lang) });
      } else if (error.code == "auth/invalid-email") {
        document.getElementById("emailInputLogIn").classList.add("is-invalid");
        document.getElementById("emailInputLogIn").classList.remove("is-valid");
        this.setState({ userErrorText: t("invalid_email", this.props.lang) });
      } else if (error.code == "auth/user-disabled") {
        document.getElementById("emailInputLogIn").classList.add("is-invalid");
        document.getElementById("emailInputLogIn").classList.remove("is-valid");
        this.setState({ userErrorText: t("user_disabled", this.props.lang) });
      }
      console.error(error);
    }
  };

  formToggle = () => {
    if (this.state.form == "logInForm") {
      document.getElementById("createAccountForm").classList.remove("d-none");
      document.getElementById("logInForm").classList.add("d-none");
      this.setState({ form: "createAccountForm" });
    } else {
      document.getElementById("logInForm").classList.remove("d-none");
      document.getElementById("createAccountForm").classList.add("d-none");
      this.setState({ form: "logInForm" });
    }
  };

  forgotPassword = () => {
    const forgotPasswordModal = document.getElementById("forgotPasswordModal");
    const modal = bootstrap.Modal.getOrCreateInstance(forgotPasswordModal);
    modal.show();
  };

  sendResetEmail = () => {
    const email = document.getElementById("account-email").value;
    if (email) {
      auth.languageCode = this.props.lang;
      sendPasswordResetEmail(auth, email)
        .then(() => {
          this.props.showToast("success", "email_sent", "success");
        })
        .catch((error) => {
          if (error.code == "auth/invalid-email") {
            this.props.showToast("error", "invalid_email", "danger");
          } else if (error.code == "auth/user-not-found") {
            this.props.showToast("error", "user_not_found", "danger");
          }
          console.error(error);
        });
    }
  };

  render() {
    const logInForm = (
      <div className="container fade-in-image" id="logInForm">
        <div className="row">
          <div className="col-md-6 offset-md-3 card bg-body-secondary">
            <div className="card-body p-lg-5">
              <h2 className="text-center text-dark">{t("login", this.props.lang)}</h2>
              <div className="text-center">
                <img src="images/kacr-logo.png" className="img-fluid profile-image-pic my-3" width="100px" alt="kacr logo" />
              </div>

              <form className="" onSubmit={this.logIn}>
                <div className="mb-3">
                  <input className="form-control" type="email" id="emailInputLogIn" placeholder="Email" required />
                  <div className="invalid-feedback">{this.state.userErrorText}</div>
                </div>

                <div className="input-group">
                  <input className="form-control" type="password" id="passwordInputLogIn" placeholder="Heslo" required />
                  <span className="input-group-text" onClick={() => showPassword("passwordInputLogIn", "passwordInputIcon")}>
                    <i className="fa fa-eye-slash" id="passwordInputIcon"></i>
                  </span>
                  <div className="invalid-feedback">{this.state.passwordErrorText}</div>
                </div>
                <small>
                  <a className="text-dark fw-bold ms-1" role="button" onClick={this.forgotPassword}>
                    {t("forgot_password", this.props.lang)} ?
                  </a>
                </small>

                <div className="text-center">
                  <button className="btn btn-primary my-3" type="submit">
                    {t("login", this.props.lang)}
                  </button>
                </div>
                <div className="text-center">
                  {t("no_account", this.props.lang)}
                  <a className="text-dark fw-bold ms-1" role="button" onClick={this.formToggle}>
                    {t("create_account", this.props.lang)}
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );

    const createAccountForm = (
      <div className="container d-none fade-in-image" id="createAccountForm">
        <div className="row">
          <div className="col-md-6 offset-md-3 card bg-body-secondary">
            <div className="card-body p-lg-5 bg-body-secondary">
              <h2 className="text-center text-dark">{t("create_account", this.props.lang)}</h2>
              <div className="text-center">
                <img src="images/kacr-logo.png" className="img-fluid profile-image-pic my-3" width="100px" alt="kacr logo" />
              </div>

              <form className="" onSubmit={this.createAccount}>
                <div className="mb-3">
                  <input className="form-control" type="email" id="emailInputCreateAccount" onChange={(e) => emailValidation(e.target)} placeholder={t("email_for_use_in_system", this.props.lang)} required />
                  <div className="invalid-feedback">{this.state.userErrorText}</div>
                </div>

                <div className="input-group">
                  <input className="form-control" type="password" id="passwordInputCreateAccount" placeholder={t("password_for_use_in_system", this.props.lang)} required />
                  <span className="input-group-text" onClick={() => showPassword("passwordInputCreateAccount", "passwordInputCreateAccountIcon")}>
                    <i className="fa fa-eye-slash" id="passwordInputCreateAccountIcon"></i>
                  </span>
                  <div className="invalid-feedback">{this.state.passwordErrorText}</div>
                </div>
                <small className="ps-1">{t("password_length", this.props.lang)}</small>

                <div className="text-center">
                  <button className="btn btn-primary my-3" type="submit">
                    {t("create_account", this.props.lang)}
                  </button>
                </div>
                <div className="text-center">
                  {t("already_have_account", this.props.lang)}
                  <a className="text-dark fw-bold ms-1" role="button" onClick={this.formToggle}>
                    {t("login", this.props.lang)}
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <>
        <button type="button" className="btn btn-outline-danger btn-sm position-absolute" style={{ top: "1rem", right: "8rem" }} data-bs-toggle="modal" data-bs-target="#problemsModal">
          {t("having_problems", this.props.lang)} ?
        </button>
        <select className="position-absolute form-select-sm" style={{ top: "1rem", right: "1rem" }} aria-label="language select" defaultValue={"cs"} onChange={(e) => this.props.languageChange(e.target.value)}>
          <option value="cs">🇨🇿 Česky</option>
          <option value="en">🇬🇧 English</option>
        </select>
        <div className="vw-100 vh-100 background" />
        <div className="container vh-80 d-flex align-items-center">
          {logInForm}
          {createAccountForm}
        </div>

        {/* ----FORGOT-PASSWORD-MODAL---- */}
        <div className="modal fade" id="forgotPasswordModal" tabIndex="-1" aria-labelledby="forgotPasswordModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="ModalLabel">
                  {t("forgot_password", this.props.lang)} ?
                </h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {t("reset_password_text", this.props.lang)}
                <div className="form-floating  my-3">
                  <input type="email" className="form-control" id="account-email" placeholder="example@gmail.com" onChange={(e) => emailValidation(e.target)} name="accountEmail" />
                  <label htmlFor="account-email">{t("account_email", this.props.lang)}</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  {t("cancel", this.props.lang)}
                </button>
                <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={this.sendResetEmail}>
                  {t("reset_password", this.props.lang)}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container col-md-6">
          <div className="card bg-body-secondary mb-5">
            <h2 className="text-center text-dark my-3">{t("tutorial_for_use", this.props.lang)}</h2>
            <ul className="nav nav-tabs nav-fill">
              <li className="nav-item">
                <a className="nav-link active" data-bs-toggle="tab" data-bs-target="#text-tutorial-wrapper">Text</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" data-bs-toggle="tab" data-bs-target="#video-tutorial-wrapper">Video</a>
              </li>
            </ul>

            {/* TUTORIAL-TAB-CONTENT */}
            <div className="tab-content">
              {/* TEXT */}
              <div className="tab-pane active" id="text-tutorial-wrapper" role="tabpanel" aria-labelledby="text-tab" tabIndex="0">
                <div className="p-3">
                  <h5>{t("login_tutorial_text", this.props.lang)}</h5>
                  <div className="d-flex flex-column mt-3 ms-3 gap-1">
                    <h6>{t("login_tutorial_text_1", this.props.lang)}</h6>
                    <span dangerouslySetInnerHTML={{ __html: t("login_tutorial_text_2", this.props.lang)}}></span>
                    <span dangerouslySetInnerHTML={{ __html: t("login_tutorial_text_3", this.props.lang)}}></span>
                  </div>
                  <div className="d-flex flex-column mt-3 ms-3 gap-1">
                    <h6>{t("login_tutorial_text_4", this.props.lang)}</h6>
                    <span dangerouslySetInnerHTML={{ __html: t("login_tutorial_text_5", this.props.lang)}}></span>
                    <span dangerouslySetInnerHTML={{ __html: t("login_tutorial_text_6", this.props.lang)}}></span>
                  </div>


                </div>
              </div>

              {/* VIDEO */}
              <div className="tab-pane" id="video-tutorial-wrapper" role="tabpanel" aria-labelledby="video-tab" tabIndex="0">
                <p className="text-center">
                  {t("work_in_progress", this.props.lang)}
                </p>
              </div>
            </div>
          </div>


        </div>

        {/* KROUZKY-LIST */}
        <div className="container">
          <div className="p-3 bg-body-secondary rounded outline mb-3 w-fit mx-auto text-center">
            <h3 className="">{t("list_of_clubs", this.props.lang)}</h3>
            <span className="badge rounded-pill text-bg-warning">{t("must_login_to_register_to_club", this.props.lang)}</span>
          </div>
          {this.props.clubs ? <ClubList clubs={this.props.clubs} lang={this.props.lang} /> : null}
        </div>

        <ProblemsModal lang={this.props.lang} />

      </>
    );
  }
}

export default Auth;
