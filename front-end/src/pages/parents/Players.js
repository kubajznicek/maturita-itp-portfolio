import React, { Component } from "react";
import { db, auth } from "../../FirebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { mapyczApi, emailValidation, autoGrow, t, closeModal } from "../../Functions";
import ToastComponent from "../../components/ToastComponent";

import "../../styles/Players.scss";

class Players extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerWholeName: "",
      playerAddress: {
        address: "",
        streetName: "",
        houseNumber: "",
        cityName: "",
        postCode: "",
      },
      playerAfterClubAction: "",
      mapySuggestions: [],
    };
  }

  componentDidMount() {
    this.props.getPlayers();
    document.querySelector("#updatePlayerModal").addEventListener("hidden.bs.modal", this.updateModalClose);
  }

  deletePlayer = async () => {
    try {
      const userID = auth.currentUser.uid;
      const playerID = this.props.player.id;
      const data = {
        userID: userID,
        playerID: playerID,
      };
      const response = await fetch(process.env.REACT_APP_FUNCTION_URL + "deletePlayer", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${JSON.stringify(data)}`, // Send the UID and playerID in the request body
      });

      if (response.status === 403) {
        this.props.showToast("error", "cant_delete_player_because_has_clubs", "danger");
      } else {
        console.log(response);
      }
    } catch (error) {
      console.error(error);
    }
  };

  updatePlayerButton = (player) => {
    this.props.setPlayer(player);
    const date = new Date(player.data.birthDate.seconds * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    this.setState(
      {
        playerBirthDate: `${year}-${month}-${day}`,
        playerAddress: {
          address: player.data.address.address,
          streetName: player.data.address.streetName,
          houseNumber: player.data.address.houseNumber,
          cityName: player.data.address.cityName,
          postCode: player.data.address.postCode,
        },
        // check if after club action is one of the options from array, if not, set it to other
        playerAfterClubAction: ["go home", "back to school", "parent pickup"].includes(player.data.afterClubAction) ? player.data.afterClubAction : "other",
      },
      () => {
        if (this.props.player.data?.kid) {
          if (this.state.playerAfterClubAction === "other") {
            const selectInput = document.getElementById("after-club-select");
            selectInput.classList.add("d-none");
            const otherInput = document.getElementById("otherInputWrapper");
            otherInput.classList.remove("d-none");
          }
        }
      }
    );
  };

  registerPlayer() {
    const registrationTab = new bootstrap.Tab(document.getElementById("registration-tab"));
    registrationTab.show();
  }

  updateModalClose = () => {
    this.resetPlayer();
  };

  suggestionClick(suggestion) {
    this.setState({
      playerAddress: {
        address: `${suggestion.name} ${suggestion.location} ${suggestion.zip}`,
        streetName: suggestion.regionalStructure[1].name,
        houseNumber: suggestion.regionalStructure[0].name,
        cityName: `${suggestion.regionalStructure[3].name} - ${suggestion.regionalStructure[2].name}`,
        postCode: suggestion.zip,
      },
      mapySuggestions: [],
    });
  }

  addressSuggestion = (e) => {
    this.setState({
      playerAddress: {
        address: e.target.value,
      },
    });
    if (e.target.value.length > 2) {
      mapyczApi(e.target.value).then((response) => {
        this.setState({ mapySuggestions: response });
      });
    } else {
      this.setState({ mapySuggestions: [] });
    }
  };

  selectChange = (e) => {
    const otherInputWrapper = document.getElementById("otherInputWrapper");
    const otherInput = document.getElementById("other-input");
    if (e.target.value === "other") {
      otherInputWrapper.classList.remove("d-none");
      e.target.classList.add("d-none");
      otherInput.focus();
      e.target.removeAttribute("required");
      otherInput.setAttribute("required", "");
    }
    this.setState({
      playerAfterClubAction: e.target.value,
    });
  };

  backToSelect = (e) => {
    const otherInputWrapper = document.getElementById("otherInputWrapper");
    const selectInput = document.getElementById("after-club-select");
    if (e.target.value.length === 0) {
      otherInputWrapper.classList.add("d-none");
      selectInput.classList.remove("d-none");
      e.target.removeAttribute("required");
      selectInput.setAttribute("required", "");
      this.setState({
        playerAfterClubAction: "",
      });
    }
  };

  showClubModal = async (clubId) => {
    const club = this.props.clubs.find((club) => club.id === clubId);
    this.setState({
      club: club,
    });
  };

  addClub(player) {
    const clubRegistrationTab = new bootstrap.Tab(document.getElementById("club-registration-tab"));
    clubRegistrationTab.show();
    // scroll  top top of the page
    window.scrollTo(0, 0);
    this.props.setPlayer(player);
  }

  /**
   * Compares two objects and returns true if they are equal.
   *
   * @param   object1  The object to compare
   * @param   object2  The object to compare
   * @returns bool.
   */
  deepEqual(object1, object2) {
    const blacklistedAttributes = ["lastUpdateTimestamp", "registrationTimestamp", "kid", "userID"];
    const differences = [];
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    for (const key of keys1) {
      if (!blacklistedAttributes.includes(key)) {
        if (typeof object1[key] === "object") {
          for (const subKey in object1[key]) {
            if (object1[key][subKey] !== object2[key][subKey]) {
              differences.push(`${key}.${subKey}`);
            }
          }
        } else if (object1[key] !== object2[key]) {
          differences.push(key);
        }
      }
    }

    if (differences.length > 0) {
      return false;
    }

    return true;
  }

  resetPlayer = () => {
    this.setState({
      playerBirthDate: "",
      playerAddress: {
        address: "",
        streetName: "",
        houseNumber: "",
        cityName: "",
        postCode: "",
      },
      mapySuggestions: [],
      playerAfterClubAction: "",
    });
    this.props.setPlayer({});
  };

  adultUpdateFormSubmit = async (e) => {
    e.preventDefault();
    const oldPlayer = this.props.player.data;
    const newPlayer = {
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
      oldAddress: this.props.player.data.oldAddress,
      birthDate: {
        seconds: Math.floor(new Date(e.target.birthDate.value).getTime() / 1000),
        nanoseconds: 0,
      },
      birthNumber: e.target.birthNumber.value,
      nationality: e.target.nationality.value,
      gender: e.target.gender.value,
      medicalConditions: e.target.medicalConditions.value,
      additionalComments: e.target.comments.value,
    };

    if (this.deepEqual(newPlayer, oldPlayer)) {
      closeModal("updatePlayerModal");
      this.props.showToast("error", "no_changes", "danger");
    } else {
      if (emailValidation(e.target.contactEmail)) {
        if (!this.deepEqual(newPlayer.address, oldPlayer.address)) {
          // if address is changed
          newPlayer.oldAddress = oldPlayer.address; // set oldAddress to address that was saved in database
        }

        try {
          await updateDoc(doc(db, "players", this.props.player.id), {
            contact: {
              email: newPlayer.contact.email,
              phone: newPlayer.contact.phone,
            },
            name: {
              firstName: newPlayer.name.firstName,
              middleName: newPlayer.name.middleName,
              lastName: newPlayer.name.lastName,
            },
            address: {
              address: newPlayer.address.address,
              streetName: newPlayer.address.streetName,
              houseNumber: newPlayer.address.houseNumber,
              cityName: newPlayer.address.cityName,
              postCode: newPlayer.address.postCode,
            },
            oldAddress: newPlayer.oldAddress,
            birthDate: new Date(newPlayer.birthDate.seconds * 1000),
            birthNumber: newPlayer.birthNumber,
            nationality: newPlayer.nationality,
            gender: newPlayer.gender,
            medicalConditions: newPlayer.medicalConditions,
            additionalComments: newPlayer.additionalComments,
            lastUpdateTimestamp: serverTimestamp(),
          });
          this.props.getPlayers();
          this.props.showToast("success", "information_updated", "success");
          closeModal("updatePlayerModal");
        } catch (error) {
          console.error(error);
        }
      }
    }
    this.resetPlayer();
  };

  kidUpdateFormSubmit = async (e) => {
    e.preventDefault();
    const oldPlayer = this.props.player.data;
    const afterClubAction = this.state.playerAfterClubAction === "other" ? e.target.otherAfterClubAction.value : this.state.playerAfterClubAction;
    const newPlayer = {
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
      oldAddress: this.props.player.data.oldAddress,
      birthDate: {
        seconds: Math.floor(new Date(e.target.birthDate.value).getTime() / 1000),
        nanoseconds: 0,
      },
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
    };

    if (this.deepEqual(newPlayer, oldPlayer)) {
      closeModal("updatePlayerModal");
      this.props.showToast("error", "no_changes", "danger");
    } else {
      if (emailValidation(e.target.contactEmail) && emailValidation(e.target.secondContactEmail)) {
        if (!this.deepEqual(newPlayer.address, oldPlayer.address)) {
          // if address is changed
          newPlayer.oldAddress = oldPlayer.address; // set oldAddress to address that was saved in database
        }

        try {
          await updateDoc(doc(db, "players", this.props.player.id), {
            parentName: e.target.parentName.value,
            contact: {
              email: newPlayer.contact.email,
              phone: newPlayer.contact.phone,
              secondEmail: newPlayer.contact.secondEmail,
              secondPhone: newPlayer.contact.secondPhone,
            },
            name: {
              firstName: newPlayer.name.firstName,
              middleName: newPlayer.name.middleName,
              lastName: newPlayer.name.lastName,
            },
            address: {
              address: newPlayer.address.address,
              streetName: newPlayer.address.streetName,
              houseNumber: newPlayer.address.houseNumber,
              cityName: newPlayer.address.cityName,
              postCode: newPlayer.address.postCode,
            },
            oldAddress: newPlayer.oldAddress,
            birthDate: new Date(newPlayer.birthDate.seconds * 1000),
            birthNumber: newPlayer.birthNumber,
            nationality: newPlayer.nationality,
            gender: newPlayer.gender,
            school: e.target.school.value,
            class: e.target.class.value,
            schoolClubSelect: e.target.schoolClubSelect.value,
            schoolClubDepartment: e.target.schoolClubDepartment.value,
            afterClubAction: afterClubAction,
            medicalConditions: newPlayer.medicalConditions,
            additionalComments: newPlayer.additionalComments,
            lastUpdateTimestamp: serverTimestamp(),
          });
          this.props.getPlayers();
          this.props.showToast("success", "information_updated", "success");
          closeModal("updatePlayerModal");
        } catch (error) {
          console.error(error);
        }
      }
    }
    this.resetPlayer();
  };

  render() {
    const noPlayers = (
      <div className="d-flex justify-content-center align-items-center flex-column">
        <h3 className="text-center mb-3">{t("welcome_text", this.props.lang)}</h3>
        <h4 className="text-center mb-5">{t("two_step_tutorial", this.props.lang)}</h4>
        <div className="">
          <h5>1. {t("register_player", this.props.lang)}</h5>
          <p>{t("click_plus_to_add_player", this.props.lang)}</p>
          <h5>2. {t("add_activity_to_player", this.props.lang)}</h5>
          <p>{t("click_button_to_add_activity", this.props.lang)}</p>
        </div>
      </div>
    );

    const players = this.props.players.map((player, idx) => {
      const playerWholeName = `${player.data.name.firstName} ${player.data.name.middleName} ${player.data.name.lastName}`;
      const playingSince = new Date(player.data.registrationTimestamp.seconds * 1000).toLocaleDateString("cs-CZ");
      const birthDate = new Date(player.data.birthDate.seconds * 1000).toLocaleDateString("cs-CZ");
      const noClub = <span className="badge text-bg-warning me-3 mb-3 text-wrap">{t("no_clubs_warning", this.props.lang)}</span>;
      const addClubButton = (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => this.addClub(player)}>
          {t("add_club", this.props.lang)}
        </button>
      );
      const playerClubs = player.data.clubs?.map((club, idx) => {
        return (
          <button className="btn btn-sm text-bg-dark focus-ring text-wrap me-3 mb-1" role="button" key={idx} onClick={() => this.showClubModal(club.id)} data-bs-toggle="modal" data-bs-target="#clubInfoModal">
            {club.name}
          </button>
        );
      });
      return (
        <div className="accordion-item mb-3 border border-1 rounded-4 bg-secondary-subtle shadow" key={player.id}>
          <h2 className="accordion-header">
            <button className="accordion-button text-capitalize rounded-4" type="button" data-bs-toggle="collapse" data-bs-target={"#panelsStayOpen-collapse" + idx} aria-expanded="true" aria-controls={"panelsStayOpen-collapse" + idx}>
              {`${player.data.name.firstName} ${player.data.name.middleName} ${player.data.name.lastName}`}
            </button>
          </h2>
          <div id={"panelsStayOpen-collapse" + idx} className="accordion-collapse collapse show">
            <div className="accordion-body">
              <div className="parent mb-3">
                <div>
                  <strong>{t("name", this.props.lang)}:</strong>
                </div>
                <div className="text-capitalize">{playerWholeName}</div>
                <div>
                  <strong>{t("playing_since", this.props.lang)}:</strong>
                </div>
                <div>{playingSince}</div>
                <div>
                  <strong>{t("date_of_birth", this.props.lang)}:</strong>
                </div>
                <div>{birthDate}</div>
              </div>
              <div className="mb-5">
                <strong>{t("club", this.props.lang)}:</strong>
                <div className="mt-1">
                  {playerClubs?.length > 0 ? playerClubs : noClub}
                  {addClubButton}
                </div>
              </div>
              <div className="d-flex justify-content-end gap-1">
                <button type="button" className="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deletePlayerModal" onClick={() => {this.setState({ playerWholeName });this.props.setPlayer(player);}}>
                  {t("delete_player", this.props.lang)}
                </button>
                <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#updatePlayerModal" onClick={() => this.updatePlayerButton(player)}>
                  {t("update_player", this.props.lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    });

    const mapySuggestionsRender = this.state.mapySuggestions?.map((suggestion, index) => {
      return (
        <option className="p-1 address-option rounded" key={index} onClick={() => this.suggestionClick(suggestion)}>
          {suggestion.name} {suggestion.location} {suggestion.zip}
        </option>
      );
    });

    const adultForm = (
      <form onSubmit={this.adultUpdateFormSubmit}>
        <small className="text-muted">* {t("mandatory_information", this.props.lang)}</small>

        <div className="row">
          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-first-name" defaultValue={this.props.player.data?.name.firstName} placeholder="Ben" name="firstName" required />
              <label htmlFor="players-first-name">{t("player_first_name", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-middle-name" defaultValue={this.props.player.data?.name.middleName} placeholder="Ben" name="middleName" />
              <label htmlFor="players-middle-name">{t("player_middle_name", this.props.lang)}</label>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-last-name" defaultValue={this.props.player.data?.name.lastName} placeholder="Ben" name="lastName" required />
              <label htmlFor="players-last-name">{t("player_last_name", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="form-floating mb-3">
          <input type="email" className="form-control" id="contact-email" defaultValue={this.props.player.data?.contact.email} onChange={(e) => emailValidation(e.target)} placeholder="@gmail.com" name="contactEmail" required />
          <label htmlFor="contact-email">{t("contact_email", this.props.lang)}*</label>
        </div>

        <div className="form-floating mb-3">
          <input type="tel" className="form-control" id="phone-number" defaultValue={this.props.player.data?.contact.phone} placeholder="123465789" name="contactPhone" required />
          <label htmlFor="phone-number">{t("contact_phone", this.props.lang)}*</label>
        </div>

        <div className="form-floating">
          <input type="text" className="form-control" id="address" placeholder="North st" value={this.state.playerAddress.address} onChange={(e) => this.addressSuggestion(e)} autoComplete="off" name="address" required />
          <label htmlFor="address">{t("address", this.props.lang)}*</label>
          <input type="hidden" className="form-control" id="street-name" defaultValue={this.state.playerAddress.streetName} placeholder="kotelnicka" name="street" />
          <input type="hidden" className="form-control" id="house-number" defaultValue={this.state.playerAddress.houseNumber} placeholder="122/12" name="houseNumber" />
          <input type="hidden" className="form-control" id="city-name" defaultValue={this.state.playerAddress.cityName} placeholder="Prague" name="city" />
          <input type="hidden" className="form-control" id="post-code" defaultValue={this.state.playerAddress.postCode} placeholder="152 12" name="postCode" />
        </div>

        <div className="bg-secondary-subtle rounded mb-3">
          {mapySuggestionsRender.length > 0 ? (
            <div className="p-1">
              <strong>{t("address_hint", this.props.lang)}</strong>
              <br />
              <small>{t("address_hint_small", this.props.lang)}</small>
              <hr />
            </div>
          ) : null}
          {mapySuggestionsRender}
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="date" className="form-control" id="birth-date" defaultValue={this.state.playerBirthDate} name="birthDate" required />
              <label htmlFor="birth-date">{t("player_birth_date", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="birth-number" defaultValue={this.props.player.data?.birthNumber} placeholder="981115/0570" name="birthNumber" required />
              <label htmlFor="birth-number">{t("player_birth_number", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-nationality" defaultValue={this.props.player.data?.nationality} placeholder="ceske" name="nationality" required />
              <label htmlFor="players-nationality">{t("player_nationality", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating">
              <select className="form-select form-select mb-3" style={{ height: "58px" }} aria-label=".form-select" defaultValue={this.props.player.data?.gender} name="gender" required>
                <option value="woman">{t("woman", this.props.lang)}</option>
                <option value="men">{t("men", this.props.lang)}</option>
              </select>
              <label htmlFor="genderSelect">{t("player_gender", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="form-floating mb-3">
          <input type="text" className="form-control" id="medical-conditions" defaultValue={this.props.player.data?.medicalConditions} name="medicalConditions" placeholder="astma" />
          <label htmlFor="medical-conditions">{t("medical_conditions", this.props.lang)}</label>
        </div>

        <div className="form-floating mb-3">
          <textarea className="form-control" onInput={(e) => autoGrow(e)} id="additional-comments" rows="3" defaultValue={this.props.player.data?.additionalComments} placeholder="cool" name="comments" />
          <label htmlFor="additional-comments">{t("comments", this.props.lang)}</label>
        </div>

        <div className="d-flex justify-content-end gap-1 mt-3">
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
            {t("cancel", this.props.lang)}
          </button>
          <button type="submit" className="btn btn-primary">
            {t("update_information", this.props.lang)}
          </button>
        </div>
      </form>
    );

    const kidForm = (
      <form onSubmit={this.kidUpdateFormSubmit}>
        <small className="text-muted">* {t("mandatory_information", this.props.lang)}</small>

        <div className="row">
          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-first-name" defaultValue={this.props.player.data?.name.firstName} placeholder="Ben" name="firstName" required />
              <label htmlFor="players-first-name">{t("player_first_name", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-middle-name" defaultValue={this.props.player.data?.name.middleName} placeholder="Ben" name="middleName" />
              <label htmlFor="players-middle-name">{t("player_middle_name", this.props.lang)}</label>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-last-name" defaultValue={this.props.player.data?.name.lastName} placeholder="Ben" name="lastName" required />
              <label htmlFor="players-last-name">{t("player_last_name", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="form-floating mb-3">
          <input type="text" className="form-control" id="parents-name" defaultValue={this.props.player.data?.parentName} placeholder="Doe" name="parentName" required />
          <label htmlFor="parents-name">{t("parent_name_surname", this.props.lang)}*</label>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="email" className="form-control" id="contact-email" defaultValue={this.props.player.data?.contact.email} onChange={(e) => emailValidation(e.target)} placeholder="@gmail.com" name="contactEmail" required />
              <label htmlFor="contact-email">{t("contact_email", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="email" className="form-control" id="second-contact-email" defaultValue={this.props.player.data?.contact.secondEmail} onChange={(e) => emailValidation(e.target)} placeholder="example@gmail.com" name="secondContactEmail" />
              <label htmlFor="second-contact-email">{t("second_contact_email", this.props.lang)}</label>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="tel" className="form-control" id="phone-number" defaultValue={this.props.player.data?.contact.phone} placeholder="123465789" name="contactPhone" required />
              <label htmlFor="phone-number">{t("contact_phone", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="tel" className="form-control" id="second-phone-number" defaultValue={this.props.player.data?.contact.secondPhone} placeholder="123465789" name="secondContactPhone" />
              <label htmlFor="second-phone-number">{t("second_contact_phone", this.props.lang)}</label>
            </div>
          </div>
        </div>

        <div className="form-floating">
          <input type="text" className="form-control" id="address" placeholder="North st" value={this.state.playerAddress.address} onChange={(e) => this.addressSuggestion(e)} autoComplete="off" name="address" required />
          <label htmlFor="address">{t("address", this.props.lang)}*</label>
          <input type="hidden" className="form-control" id="street-name" defaultValue={this.state.playerAddress.streetName} placeholder="kotelnicka" name="street" />
          <input type="hidden" className="form-control" id="house-number" defaultValue={this.state.playerAddress.houseNumber} placeholder="122/12" name="houseNumber" />
          <input type="hidden" className="form-control" id="city-name" defaultValue={this.state.playerAddress.cityName} placeholder="Prague" name="city" />
          <input type="hidden" className="form-control" id="post-code" defaultValue={this.state.playerAddress.postCode} placeholder="152 12" name="postCode" />
        </div>

        <div className="bg-secondary-subtle rounded mb-3">
          {mapySuggestionsRender.length > 0 ? (
            <div className="p-1">
              <strong>{t("address_hint", this.props.lang)}</strong>
              <br />
              <small>{t("address_hint_small", this.props.lang)}</small>
              <hr />
            </div>
          ) : null}
          {mapySuggestionsRender}
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="date" className="form-control" id="birth-date" defaultValue={this.state.playerBirthDate} name="birthDate" required />
              <label htmlFor="birth-date">{t("player_birth_date", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="birth-number" defaultValue={this.props.player.data?.birthNumber} placeholder="981115/0570" name="birthNumber" required />
              <label htmlFor="birth-number">{t("player_birth_number", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-nationality" defaultValue={this.props.player.data?.nationality} placeholder="ceske" name="nationality" required />
              <label htmlFor="players-nationality">{t("player_nationality", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating">
              <select className="form-select form-select mb-3" style={{ height: "58px" }} aria-label=".form-select" defaultValue={this.props.player.data?.gender} name="gender" required>
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
              <input type="text" className="form-control" id="players-school" defaultValue={this.props.player.data?.school} placeholder="zs lipence" name="school" required />
              <label htmlFor="players-school">{t("player_school", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-class" defaultValue={this.props.player.data?.class} placeholder="8.B" name="class" required />
              <label htmlFor="players-class">{t("player_class", this.props.lang)}*</label>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="form-floating">
              <select className="form-select form-select mb-3" style={{ height: "58px" }} aria-label=".form-select example" defaultValue={this.props.player.data?.schoolClubSelect} name="schoolClubSelect" required>
                <option disabled hidden value={""}>
                  {t("player_school_club", this.props.lang)}*
                </option>
                <option value={true}>{t("yes", this.props.lang)}</option>
                <option value={false}>{t("no", this.props.lang)}</option>
              </select>
              <label htmlFor="schoolClubSelect">{t("player_school_club", this.props.lang)}*</label>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="players-school-club" defaultValue={this.props.player.data?.schoolClubDepartment} placeholder="2" name="schoolClubDepartment" />
              <label htmlFor="players-school-club">{t("player_school_club_department", this.props.lang)}</label>
            </div>
          </div>
        </div>

        <div className="form-floating mb-3">
          <select className="form-select mb-3" style={{ height: "58px" }} aria-label="form-select" id="after-club-select" value={this.state.playerAfterClubAction} name="afterClubAction" onChange={(e) => this.selectChange(e)} required>
            <option value="go home">{t("go_home", this.props.lang)}</option>
            <option value="back to school">{t("back_to_school", this.props.lang)}</option>
            <option value="parent pickup">{t("parent_pickup", this.props.lang)}</option>
            <option value="other">{t("other", this.props.lang)}:</option>
          </select>
          <label htmlFor="after-club-select">{t("after_club_action", this.props.lang)}*</label>
        </div>

        <div className="form-floating mb-3 d-none" id="otherInputWrapper">
          <input type="text" className="form-control" id="other-input" placeholder="other" name="otherAfterClubAction" defaultValue={this.props.player.data?.afterClubAction} onBlur={(e) => this.backToSelect(e)}></input>
          <label htmlFor="other-input">{t("other", this.props.lang)}</label>
        </div>

        <div className="form-floating mb-3">
          <input type="text" className="form-control" id="medical-conditions" defaultValue={this.props.player.data?.medicalConditions} placeholder="astma" name="medicalConditions" />
          <label htmlFor="medical-conditions">{t("medical_conditions", this.props.lang)}</label>
        </div>

        <div className="form-floating mb-3">
          <textarea className="form-control" onInput={(e) => autoGrow(e)} id="additional-comments" rows="3" defaultValue={this.props.player.data?.additionalComments} placeholder="cool" name="comments" />
          <label htmlFor="additional-comments">{t("comments", this.props.lang)}</label>
        </div>

        <div className="d-flex justify-content-end gap-1 mt-3">
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
            {t("cancel", this.props.lang)}
          </button>
          <button type="submit" className="btn btn-primary">
            {t("update_information", this.props.lang)}
          </button>
        </div>
      </form>
    );

    return (
      <>
        <div className="position-fixed z-n1 container-fluid h-100 icon-background">
          <img src="images/wicket_2_drawing.png" alt="bat drawing" className="position-absolute start-3" />
          <img src="images/wicket_2_drawing.png" alt="bat drawing" className="position-absolute end-20 bottom-15" />
          <img src="images/wicket_drawing.png" alt="bat drawing" className="position-absolute bottom-15" />
        </div>
        <div className="d-flex justify-content-center container-sm">
          <div className="accordion container" id="accordionPanelsStayOpen">
            {this.props.players.length === 0 ? noPlayers : players}
          </div>
        </div>

        {/* -----add player button----- */}
        <button className="btn btn-primary circular-btn position-fixed" onClick={this.registerPlayer}>
          <i className="fas fa-plus scale-2"></i>
        </button>

        {/* ----DELETION-MODAL---- */}
        <div className="modal fade" id="deletePlayerModal" tabIndex="-1" aria-labelledby="deletePlayerModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="ModalLabel">
                  {t("sure_delete_player", this.props.lang)} ?
                </h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {t("sure_delete_player", this.props.lang)} <strong className="text-capitalize">{this.state.playerWholeName}</strong> ? {t("action_non_returnable", this.props.lang)}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  {t("cancel", this.props.lang)}
                </button>
                <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={this.deletePlayer}>
                  {t("delete_player", this.props.lang)}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ----UPDATE-MODAL---- */}
        <div className="modal fade" id="updatePlayerModal" tabIndex="-1" aria-labelledby="updatePlayerModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="ModalLabel">
                  {t("update_player_information", this.props.lang)}
                </h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">{this.props.player.data?.kid ? kidForm : adultForm}</div>
            </div>
          </div>
        </div>

        {/* ----CLUB-MODAL---- */}
        <div className="modal fade" id="clubInfoModal" tabIndex="-1" aria-labelledby="clubInfoLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="ModalLabel">
                  {this.state.club?.name}
                </h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="parent">
                  <div>
                    <strong>{t("address", this.props.lang)}:</strong>
                  </div>
                  <div className="text-capitalize">{this.state.club?.data.address}</div>
                  <div>
                    <strong>{t("start_date", this.props.lang)}:</strong>
                  </div>
                  <div>{new Date(this.state.club?.data.date.startDate.seconds * 1000).toLocaleDateString("cs-CZ")}</div>
                  <div>
                    <strong>{t("end_date", this.props.lang)}:</strong>
                  </div>
                  <div>{new Date(this.state.club?.data.date.endDate.seconds * 1000).toLocaleDateString("cs-CZ")}</div>
                  <div>
                    <strong>{t("time", this.props.lang)}:</strong>
                  </div>
                  <div>
                    {this.state.club?.data.time.startTime} - {this.state.club?.data.time.endTime}
                  </div>
                  <div>
                    <strong>{t("meeting_point", this.props.lang)}:</strong>
                  </div>
                  <div>{this.state.club?.data.meetingPoint}</div>
                  <div>
                    <strong>{t("holidays_exceptions", this.props.lang)}:</strong>
                  </div>
                  <div>{this.state.club?.data.holidaysExceptions}</div>
                  <div>
                    <strong>{t("comments", this.props.lang)}:</strong>
                  </div>
                  <div>{this.state.club?.data.comments}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  {t("cancel", this.props.lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Players;
