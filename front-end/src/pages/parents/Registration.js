import React, { Component } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../FirebaseConfig';
import ToastComponent from "../../components/ToastComponent"
import { autoGrow, emailValidation, mapyczApi, t } from '../../Functions';

import '../../styles/Registration.scss'

class Registration extends Component {

  constructor(props) {
    super(props);
    this.state = {
      registrationType: null,
      mapySuggestions: [],
      addressRender: "",
      streetName: "",
      houseNumber: "",
      cityName: "",
      postCode: "",
      afterClubActionValue: "",
    };
  }

  successfulRegistration ()  {
    this.setState({
      registrationType: null,
      addressRender: "",
      streetName: "",
      houseNumber: "",
      cityName: "",
      postCode: "",
      afterClubActionValue: "",
      mapySuggestions: []
    }, () => {
      const playerTab = new bootstrap.Tab(document.getElementById('players-tab'));
      playerTab.show()
      this.props.showToast("success", "player_registration_successful_toast", "success")
    })
    this.props.getPlayers(true)
  }

  suggestionClick (suggestion) {
    this.setState({
      addressRender: `${suggestion.name} ${suggestion.location} ${suggestion.zip}`,
      streetName: suggestion.regionalStructure[1].name,
      houseNumber: suggestion.regionalStructure[0].name,
      cityName: `${suggestion.regionalStructure[3].name} - ${suggestion.regionalStructure[2].name}`,
      postCode: suggestion.zip,
      mapySuggestions: []
    })
  }

  addressSuggestion = (e) => {
    this.setState({ addressRender: e.target.value })
    if (e.target.value.length > 2) {
      mapyczApi(e.target.value)
      .then((response) => {
        this.setState({ mapySuggestions: response })
      })
    }
    else {
      this.setState({ mapySuggestions: [] })
    }
  }

  selectChange = (e) => {
    const otherInputWrapper = document.getElementById("otherInputWrapper")
    const otherInput = document.getElementById("other-input")
    const selectInput = document.getElementById("afterClubActionInputWrapper")
    if (e.target.value === "other") {
      otherInputWrapper.classList.remove("d-none")
      selectInput.classList.add("d-none")
      otherInput.focus()
      e.target.removeAttribute("required")
      otherInput.setAttribute("required", "")
    }
    this.setState({
      afterClubActionValue: e.target.value
    })
  }

  backToSelect = (e) => {
    const otherInputWrapper = document.getElementById("otherInputWrapper")
    const selectInput = document.getElementById("afterClubActionInputWrapper")
    if (e.target.value.length === 0) {
      otherInputWrapper.classList.add("d-none")
      selectInput.classList.remove("d-none")
      e.target.removeAttribute("required")
      selectInput.setAttribute("required", "")
    }
    this.setState({
      afterClubActionValue: e.target.value
    })
  }

  resetRegistration = () => {
    this.setState({
      registrationType: null,
      addressRender: "",
      streetName: "",
      houseNumber: "",
      cityName: "",
      postCode: "",
      afterClubActionValue: "",
      mapySuggestions: [],
    })
  }

  returnToPlayerTab = () => {
    const playerTab = new bootstrap.Tab(document.getElementById('players-tab'));
    playerTab.show()
    this.setState({
      registrationType: null,
      addressRender: "",
      streetName: "",
      houseNumber: "",
      cityName: "",
      postCode: "",
      afterClubActionValue: "",
      mapySuggestions: [],
    })
  }

  registrationTypeSet = (type) => {
    this.setState({
      registrationType: type
    })
  }


  adultRegistrationFormSubmit = async (e) => {
    e.preventDefault()
    if (!/^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/.test(e.target.contactEmail.value)) {
      e.target.contactEmail.focus()
    }
    else {
      const docRef = await addDoc(collection(db, "players"), {
        contact: {
          email: e.target.contactEmail.value,
          phone: e.target.contactPhone.value,
        },
        name: {
          firstName: e.target.firstName.value,
          middleName: e.target.middleName.value,
          lastName: e.target.lastName.value,
        },
        address: {
          address: e.target.address.value,
          streetName: e.target.street.value,
          houseNumber: e.target.houseNumber.value,
          cityName: e.target.city.value,
          postCode: e.target.postCode.value,
        },
        oldAddress: null,
        birthDate: new Date(e.target.birthDate.value),
        birthNumber: e.target.birthNumber.value,
        nationality: e.target.nationality.value,
        gender: e.target.gender.value,
        medicalConditions: e.target.medicalConditions.value,
        additionalComments: e.target.comments.value,
        kid: false,
        userID: [auth.currentUser.uid],
        clubs: [],
        registrationTimestamp: serverTimestamp()
      })
      this.successfulRegistration()
    }
  }

  kidRegistrationFormSubmit = async (e) => {
    e.preventDefault()
    let validEmail = true
    const afterClubAction = e.target.afterClubAction.value === "" ? e.target.otherAfterClubAction.value : e.target.afterClubAction.value
    if (!/^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/.test(e.target.contactEmail.value)) {
      e.target.contactEmail.focus()
      validEmail = false
    } else {
      validEmail = validEmail && true
    }
    if (e.target.secondContactEmail.value.length > 0) {
      if (!/^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/.test(e.target.secondContactEmail.value)) {
        e.target.secondContactEmail.focus()
        validEmail = false
      } else {
        validEmail = validEmail && true
      }
    }
    if (validEmail) {
      const docRef = await addDoc(collection(db, "players"), {
        parentName: e.target.parentName.value,
        contact: {
          email: e.target.contactEmail.value,
          phone: e.target.contactPhone.value,
          secondEmail: e.target.secondContactEmail.value,
          secondPhone: e.target.secondContactPhone.value,
        },
        name: {
          firstName: e.target.firstName.value,
          middleName: e.target.middleName.value,
          lastName: e.target.lastName.value,
        },
        address: {
          address: e.target.address.value,
          streetName: e.target.street.value,
          houseNumber: e.target.houseNumber.value,
          cityName: e.target.city.value,
          postCode: e.target.postCode.value,
        },
        oldAddress: null,
        birthDate: new Date(e.target.birthDate.value),
        birthNumber: e.target.birthNumber.value,
        nationality: e.target.nationality.value,
        gender: e.target.gender.value,
        school: e.target.school.value,
        class: e.target.class.value,
        schoolClubSelect: e.target.schoolClubSelect.value,
        schoolClubDepartment: e.target.schoolClubDepartment.value,
        afterClubAction: afterClubAction,
        medicalConditions: e.target.medicalConditions.value,
        additionalComments: e.target.comments.value,
        kid: true,
        userID: [auth.currentUser.uid],
        clubs: [],
        registrationTimestamp: serverTimestamp(),
      })
      this.successfulRegistration()
    }
  }
  
  render() {
    const resetRegistrationButton = (
      <button className="btn position-absolute return-button" onClick={this.resetRegistration}>
        <span><i className="fa fa-arrow-left fa-3x"></i></span>
      </button>
    );

    const mapySuggestionsRender = this.state.mapySuggestions?.map((suggestion, index) => {
      return (
        <div className="p-1 address-option rounded" key={index} onClick={() => this.suggestionClick(suggestion)}>{suggestion.name} {suggestion.location} {suggestion.zip}</div>
      )
    });

    const wizard = (
      <>
        <button className="btn position-absolute return-button z-1" onClick={this.returnToPlayerTab}>
          <span><i className="fa fa-arrow-left fa-3x"></i></span>
        </button>
        <div className="p-3 position-absolute z-1 heading-box">
          <h3>{t("want_to_register", this.props.lang)}:</h3>
        </div>
        <div className="w-100 vh-100 overflow-hidden">
          <button className="btn background-child" onClick={() =>this.registrationTypeSet("kid")}>
            {t("child", this.props.lang)}
          </button>
          <button className="btn background-adult" onClick={() => this.registrationTypeSet("adult")}>
            {t("adult", this.props.lang)}
          </button>
        </div>
      </>
    );

    const adultRegistrationForm = (
      <form onSubmit={this.adultRegistrationFormSubmit} className="registration-form">
        <small className="text-muted">* {t("mandatory_information", this.props.lang)}</small>

        <div className="row">
          <div className="col-lg-4"> 
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-first-name" placeholder="Ben" name="firstName" required/>
              <label htmlFor="players-first-name">{t("player_first_name", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-middle-name" placeholder="Ben" name="middleName"/>
              <label htmlFor="players-middle-name">{t("player_middle_name", this.props.lang)}</label>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-last-name" placeholder="Ben" name="lastName" required/>
              <label htmlFor="players-last-name">{t("player_last_name", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="form-floating mb-3">
          <input type="email" className="form-control" id="contact-email" placeholder="example@gmail.com" defaultValue={auth.currentUser.email} onChange={(e) => emailValidation(e.target)} name="contactEmail" required/>
          <label htmlFor="contact-email">{t("contact_email", this.props.lang)}*</label>
        </div>

        <div className="form-floating mb-3">
          <input type="tel" className="form-control" id="phone-number" placeholder="123465789" name="contactPhone" required/>
          <label htmlFor="phone-number">{t("contact_phone", this.props.lang)}*</label>
        </div>


        <div className="form-floating">
          <input type="text" className="form-control" id="address" placeholder="North st" value={this.state.addressRender} onChange={e => this.addressSuggestion(e)} autoComplete="off" name="address" required/>
          <label htmlFor="address">{t("address", this.props.lang)}*</label>
          <input type="hidden" className="form-control" id="street-name" value={this.state.streetName} placeholder="kotelnicka" name="street"/>
          <input type="hidden" className="form-control" id="house-number" value={this.state.houseNumber} placeholder="122/12" name="houseNumber"/>
          <input type="hidden" className="form-control" id="city-name" value={this.state.cityName} placeholder="Prague" name="city"/>
          <input type="hidden" className="form-control" id="post-code" value={this.state.postCode} placeholder="152 12" name="postCode"/>
        </div>

        <div className="bg-secondary-subtle rounded mb-3">
          {mapySuggestionsRender.length > 0 ? <div className="p-1"><strong>{t("address_hint", this.props.lang)}</strong><br/><small>{t("address_hint_small", this.props.lang)}</small><hr/></div> : null}
          {mapySuggestionsRender}
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="date" className="form-control" id="birth-date" name="birthDate" required/>
              <label htmlFor="birth-date">{t("player_birth_date", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="birth-number" placeholder="981115/0570" name="birthNumber" required/>
              <label htmlFor="birth-number">{t("player_birth_number", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-nationality" placeholder="ceske" name="nationality" required/>
              <label htmlFor="players-nationality">{t("player_nationality", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating">
            <select className="form-select form-select mb-3" style={{height: "58px"}} aria-label=".form-select example" defaultValue={""} id="genderSelect" name="gender" required>
              <option disabled hidden value={""}></option>
              <option value="woman">{t("woman", this.props.lang)}</option>
              <option value="men">{t("men", this.props.lang)}</option>
            </select>
            <label htmlFor="genderSelect">{t("player_gender", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="form-floating mb-3">
          <input type="text" className="form-control" id="medical-conditions" placeholder="astma" name="medicalConditions"/>
          <label htmlFor="medical-conditions">{t("medical_conditions", this.props.lang)}</label>
        </div>



        <div className="form-floating mb-3">
          <textarea className="form-control" onInput={(e) => autoGrow(e)} id="additional-comments" rows="3" name="comments" placeholder="cool"/>
          <label htmlFor="additional-comments">{t("comments", this.props.lang)}</label>
        </div>


        <div className="form-check">
          <input className="form-check-input" type="checkbox" value="" id="obchodni-podminky-check" required/>
          <label className="form-check-label" htmlFor="obchodni-podminky-check">
            {t("i_agree_with", this.props.lang)} <a href="http://www.kriketovaakademie.com/obchodni-podminky.html" target="_blank">{t("terms_and_conditions", this.props.lang)}</a>*
          </label>
        </div>

        <div className="form-check">
          <input className="form-check-input" type="checkbox" value="" id="gdpr-check" required/>
          <label className="form-check-label" htmlFor="gdpr-check">
            {t("i_agree_with", this.props.lang)} <a href="http://www.kriketovaakademie.com/gdpr.html" target="_blank">GDPR</a>*
          </label>
        </div>
        
        <div className="text-end">
          <button type="submit" className="btn btn-lg btn-primary mt-3">{t("submit", this.props.lang)}</button>
        </div>
      </form>
    );

    const kidRegistrationForm = (
      <form onSubmit={this.kidRegistrationFormSubmit} className="registration-form">
        <small className="text-muted">* {t("mandatory_information", this.props.lang)}</small>

        <div className="row">
          <div className="col-lg-4"> 
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-first-name" placeholder="Ben" name="firstName" required/>
              <label htmlFor="players-first-name">{t("player_first_name", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-middle-name" placeholder="Ben" name="middleName"/>
              <label htmlFor="players-middle-name">{t("player_middle_name", this.props.lang)}</label>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-last-name" placeholder="Ben" name="lastName" required/>
              <label htmlFor="players-last-name">{t("player_last_name", this.props.lang)}*</label>
            </div>
          </div>
        </div>

          <div className="form-floating mb-3">
            <input type="text" className="form-control" id="parents-name" placeholder="Doe" name="parentName" required/>
            <label htmlFor="parents-name">{t("parent_name_surname", this.props.lang)}*</label>
          </div>

          <div  className="row">
            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="email" className="form-control" id="contact-email" placeholder="example@gmail.com" defaultValue={auth.currentUser.email} onChange={(e) => emailValidation(e.target)} name="contactEmail" required/>
                <label htmlFor="contact-email">{t("contact_email", this.props.lang)}*</label>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="email" className="form-control" id="second-contact-email" placeholder="example@gmail.com" onChange={(e) => emailValidation(e.target)} name="secondContactEmail"/>
                <label htmlFor="second-contact-email">{t("second_contact_email", this.props.lang)}</label>
              </div>
            </div>
          </div>


          <div  className="row">
            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="tel" className="form-control" id="phone-number" placeholder="123465789" name="contactPhone" required/>
                <label htmlFor="phone-number">{t("contact_phone", this.props.lang)}*</label>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="tel" className="form-control" id="second-phone-number" placeholder="123465789" name="secondContactPhone"/>
                <label htmlFor="second-phone-number">{t("second_contact_phone", this.props.lang)}</label>
              </div>
            </div>
          </div>

          <div className="form-floating">
            <input type="text" className="form-control" id="address" placeholder="North st" value={this.state.addressRender} onChange={e => this.addressSuggestion(e)} autoComplete="off" name="address" required/>
            <label htmlFor="address">{t("address", this.props.lang)}*</label>
            <input type="hidden" className="form-control" id="street-name" value={this.state.streetName} placeholder="kotelnicka" name="street"/>
            <input type="hidden" className="form-control" id="house-number" value={this.state.houseNumber} placeholder="122/12" name="houseNumber"/>
            <input type="hidden" className="form-control" id="city-name" value={this.state.cityName} placeholder="Prague" name="city"/>
            <input type="hidden" className="form-control" id="post-code" value={this.state.postCode} placeholder="152 12" name="postCode"/>
          </div>

          <div className="bg-secondary-subtle rounded mb-3">
            {mapySuggestionsRender.length > 0 ? <div className="p-1"><strong>{t("address_hint", this.props.lang)}</strong><br/><small>{t("address_hint_small", this.props.lang)}</small><hr/></div> : null}
            {mapySuggestionsRender}
          </div>


          <div className="row">
            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="date" className="form-control" id="birth-date" name="birthDate" required/>
                <label htmlFor="birth-date">{t("player_birth_date", this.props.lang)}*</label>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="text" className="form-control" id="birth-number" placeholder="981115/0570" name="birthNumber" required/>
                <label htmlFor="birth-number">{t("player_birth_number", this.props.lang)}*</label>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="text" className="form-control" id="players-nationality" placeholder="ceske" name="nationality" required/>
                <label htmlFor="players-nationality">{t("player_nationality", this.props.lang)}*</label>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="form-floating">
              <select className="form-select form-select mb-3" style={{height: "58px"}} aria-label=".form-select example" defaultValue={""} id="genderSelect" name="gender" required>
                <option disabled hidden value={""}></option>
                <option value="woman">{t("woman", this.props.lang)}</option>
                <option value="men">{t("men", this.props.lang)}</option>
              </select>
              <label htmlFor="genderSelect">{t("player_gender", this.props.lang)}*</label>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="text" className="form-control" id="players-school" placeholder="zs lipence" name="school" required/>
                <label htmlFor="players-school">{t("player_school", this.props.lang)}*</label>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="text" className="form-control" id="players-class" placeholder="8.B" name="class" required/>
                <label htmlFor="players-class">{t("player_class", this.props.lang)}*</label>
              </div>
            </div>
          </div>

          <div  className="row">
            <div className="col-lg-6">
              <div className="form-floating">
              <select className="form-select form-select mb-3" style={{height: "58px"}} aria-label=".form-select example" defaultValue={""} id="schoolClubSelect" name="schoolClubSelect" required>
                <option disabled hidden value={""}></option>
                <option value={true}>{t("yes", this.props.lang)}</option>
                <option value={false}>{t("no", this.props.lang)}</option>
              </select>
              <label htmlFor="schoolClubSelect">{t("player_school_club", this.props.lang)}*</label>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="form-floating mb-3">
                <input type="text" className="form-control" id="players-school-club" placeholder="2" name="schoolClubDepartment"/>
                <label htmlFor="players-school-club">{t("player_school_club_department", this.props.lang)}</label>
              </div>
            </div>
          </div>

          <div className="form-floating" id="afterClubActionInputWrapper">
            <select className="form-select mb-3" style={{height: "58px"}} aria-label="form-select" id="afteClubSelect" value={this.state.afterClubActionValue} name="afterClubAction" onChange={(e) => this.selectChange(e)} required>
              <option disabled hidden value={""}></option>
              <option value="go home">{t("go_home", this.props.lang)}</option>
              <option value="back to school">{t("back_to_school", this.props.lang)}</option>
              <option value="parent pickup">{t("parent_pickup", this.props.lang)}</option>
              <option value="other">{t("other", this.props.lang)}:</option>
            </select>
            <label htmlFor="afteClubSelect">{t("after_club_action", this.props.lang)}*</label>
          </div>
          

          <div className="form-floating mb-3 d-none" id="otherInputWrapper">
            <input type="text" className="form-control" id="other-input" placeholder="other" name="otherAfterClubAction" onBlur={(e) => this.backToSelect(e)}></input>
            <label htmlFor="other-input">{t("other", this.props.lang)}</label>
          </div>

          <div className="form-floating mb-3">
            <input type="text" className="form-control" id="medical-conditions" placeholder="astma" name="medicalConditions"/>
            <label htmlFor="medical-conditions">{t("medical_conditions", this.props.lang)}</label>
          </div>

          <div className="form-floating mb-3">
            <textarea className="form-control" onInput={(e) => autoGrow(e)} id="additional-comments" rows="3" placeholder="cool" name="comments"/>
            <label htmlFor="additional-comments">{t("comments", this.props.lang)}</label>
          </div>

          <div className="form-check">
            <input className="form-check-input" type="checkbox" value="" id="obchodni-podminky-check" required/>
            <label className="form-check-label" htmlFor="obchodni-podminky-check">
              {t("i_agree_with", this.props.lang)} <a href="http://www.kriketovaakademie.com/obchodni-podminky.html" target="_blank">{t("terms_and_conditions", this.props.lang)}</a>*
            </label>
          </div>

          <div className="form-check">
          <input className="form-check-input" type="checkbox" value="" id="gdpr-check" required/>
          <label className="form-check-label" htmlFor="gdpr-check">
            {t("i_agree_with", this.props.lang)} <a href="http://www.kriketovaakademie.com/gdpr.html" target="_blank">GDPR</a>*
          </label>
        </div>
          
          <div className="text-end">
            <button type="submit" className="btn btn-lg btn-primary mt-3">{t("submit", this.props.lang)}</button>
          </div>
        </form>
    );
  
    if (this.state.registrationType == null) {
      return (
        <>
          {wizard}
        </>
      );
    }
    else {
      return (
        <div className="form-wrapper container mt-5">
          {resetRegistrationButton}
          {this.state.registrationType === "adult" ? adultRegistrationForm : kidRegistrationForm}
        </div>
      );
    }
  }
}

export default Registration
