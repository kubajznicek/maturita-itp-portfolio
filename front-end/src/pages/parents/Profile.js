import React, { Component } from "react"
import { auth } from "../../FirebaseConfig"
import {  signOut, updateProfile, updateEmail, updatePassword } from "firebase/auth"
import ToastComponent from "../../components/ToastComponent"
import { showPassword, t } from "../../Functions"

import "../../styles/Profile.scss"


class Profile extends Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  async signOut () {
    try {
        await auth.signOut(auth)
    } catch (error) {
        console.error(error)
    }
    window.location.reload()
  }

  saveChanges = () => {
    const displayName = document.getElementById("display-name").value == "" ? auth.currentUser.displayName : document.getElementById("display-name").value
    const email = document.getElementById("user-email").value
    const newPassword = document.getElementById("new-password").value
    const newPasswordRepeat = document.getElementById("new-password-repeat").value


    if (displayName != auth.currentUser.displayName) {
      this.displayNameChange(displayName)
    }
    
    if (email != auth.currentUser.email) {
      this.emailChange(email)
    }

    if (newPassword != "") {
      if (newPassword == newPasswordRepeat) {
        updatePassword(auth.currentUser, newPassword)
          .then(() => {
            this.props.showToast("success", "changes_were_saved", "success")
          }).catch((error) => {
            this.props.showToast("error", "try_sign_out", "danger")
            console.error(error)
          })
      } else {
        this.props.showToast("error", "password_dont_match", "danger")
      }
    }
    if (displayName == auth.currentUser.displayName && email == auth.currentUser.email && newPassword == "") {
      this.props.showToast("error", "no_changes", "danger")      
    }
  }

  async displayNameChange(displayName) {
    await updateProfile(auth.currentUser, {
        displayName: displayName 
      }).then(() => {
        this.props.showToast("success", "changes_were_saved", "success")
      }).catch((error) => {
        console.error(error)
      })
  }

  async emailChange(email) {
    await updateEmail(auth.currentUser, email)
      .then(() => {
          this.props.showToast("success", "changes_were_saved", "success")
      }).catch((error) => {
          this.props.showToast("error", "try_sign_out", "danger")
          console.error(error)
      })
  }

  disableUser = async () => {
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      try {
        await fetch(process.env.REACT_APP_FUNCTION_URL + "disableAccount", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uid }) // Send the UID in the request body
        });

        // sign out the user
        await signOut(auth);
        window.location.reload()
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }


  render() {
    return (
      <>
      <div className="container">
  

        <h4 className="font-weight-bold py-3 mb-4">
          {t("account_settings", this.props.lang)}
        </h4>

        <div className="card overflow-hidden min-vh-50">
          <div className="row no-gutters row-bordered row-border-light">
            <div className="col-md-3 pt-0">

              <nav>
                <div className="list-group list-group-flush account-settings-links" id="nav-tab" role="tablist">
                  <button className="list-group-item list-group-item-action active" id="nav-general-tab" data-bs-toggle="tab" data-bs-target="#nav-general" type="button" role="tab" aria-controls="nav-general" aria-selected="true">{t("general", this.props.lang)}</button>
                  <button className="list-group-item list-group-item-action" id="nav-password-tab" data-bs-toggle="tab" data-bs-target="#nav-password" type="button" role="tab" aria-controls="nav-password" aria-selected="false">{t("change_password", this.props.lang)}</button>
                  <button className="list-group-item list-group-item-action" id="nav-information-tab" data-bs-toggle="tab" data-bs-target="#nav-information" type="button" role="tab" aria-controls="nav-information" aria-selected="false">{t("personal_information", this.props.lang)}</button>
                </div>
              </nav>

            </div>
            <div className="col-md-9">
              <div className="tab-content">
                <div className="tab-pane fade active show" id="nav-general">

                  {/* <div className="card-body d-flex">
                    <img src="https://bootdey.com/img/Content/avatar/avatar1.png" alt="profile picture" className="img-thumbnail" width={200}/>
                    <div className="ms-3">
                      <label htmlFor="picture-upload" className="form-label">{t("upload_image", this.props.lang)}</label>
                      <input className="form-control form-control" id="picture-upload" type="file" disabled/>
                      <div className="small mt-1">{t("allowed_image_formats", this.props.lang)}</div>
                    </div>
                  </div> */}

                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">{t("user_name", this.props.lang)}</label>
                      <input type="text" className="form-control mb-1" id="display-name" defaultValue={auth.currentUser.displayName}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t("email", this.props.lang)}</label>
                      <input type="text" className="form-control mb-1" id="user-email" defaultValue={auth.currentUser.email}/>
                      {/* <div className="d-flex align-items-baseline justify-content-between alert alert-warning mt-3">
                        Váš e-mail není ověřený.
                        <button className="btn btn-outline-secondary" disabled>Zaslat ověřovací email</button>
                      </div> */}
                    </div>
                  </div>

                </div>

                <div className="tab-pane fade" id="nav-password">
                  <div className="card-body pb-2">

                    <label className="form-label" htmlFor="new-password">{t("new_password", this.props.lang)}</label>
                    <div className="input-group">
                      <input type="password" className="form-control" id="new-password"/>
                      <span className="input-group-text" onClick={() => showPassword("new-password", "new-password-icon")}><i className="fa fa-eye-slash" id="new-password-icon"></i></span>
                    </div>

                    <label className="form-label" htmlFor="new-password-repeat">{t("password_repeat", this.props.lang)}</label>
                    <div className="input-group">
                      <input type="password" className="form-control" id="new-password-repeat"/>
                      <span className="input-group-text" onClick={() => showPassword("new-password-repeat", "new-password-icon-repeat")}><i className="fa fa-eye-slash" id="new-password-icon-repeat"></i></span>
                    </div>
                    <small>{t("password_length", this.props.lang)}</small>

                  </div>
                </div>

                <div className="tab-pane fade" id="nav-information">
                  <div className="card-body pb-2">
                    <div className="d-flex gap-3 mb-5">
                      <a href="http://www.kriketovaakademie.com/obchodni-podminky.html" target="_blank">{t("terms_and_conditions_static", this.props.lang)}</a>
                      <a href="http://www.kriketovaakademie.com/gdpr.html" target="_blank">GDPR</a>
                    </div>
                    <button type="button" className="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteAccountModal">{t("disable_account", this.props.lang)}</button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="w-100 mt-3 mb-5 d-flex justify-content-between">
          <button type="button" className="btn btn-secondary" onClick={this.signOut}>{t("logout", this.props.lang)}</button>
          <button type="button" className="btn btn-primary" onClick={this.saveChanges}>{t("save_changes", this.props.lang)}</button>
        </div>

        {/* ----DELETE ACCOUNT MODAL---- */}
        <div className="modal fade" id="deleteAccountModal" tabIndex="-1" aria-labelledby="deleteAccountModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="exampleModalLabel">{t("sure_disable_account", this.props.lang)} ?</h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {t("disable_account_text", this.props.lang)} 
                {/* Všechny vaše údaje budou smazány. */}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">{t("cancel", this.props.lang)}</button>
                <button type="button" className="btn btn-danger" onClick={this.disableUser}>{t("disable_account", this.props.lang)}</button>
              </div>
            </div>
          </div>
        </div>

      </div>
      </>
    )
  }
}

export default Profile
