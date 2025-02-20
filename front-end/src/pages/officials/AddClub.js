import React, { Component } from 'react'
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';
import { t, autoGrow } from '../../Functions';


class AddClub extends Component {

  constructor(props) {
    super(props);
    this.state = {
     
    };
  }

  backToClubList () {
    const clubsTab = new bootstrap.Tab(document.getElementById('clubs-tab'));
    clubsTab.show()
  }

  registerPlayer () {
    const registrationTab = new bootstrap.Tab(document.getElementById('add-club-tab'));
    registrationTab.show()
  }
  docRef = null;

  registerClub = async (e) => {
    e.preventDefault();
    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const checkedWeekdays = []
    weekdays.forEach(weekday => {
      if (e.target[weekday].checked) {
        checkedWeekdays.push(weekday)
      }
    })

    try {
      this.docRef = await addDoc(collection(db, 'clubs'), {
        name: e.target.clubName.value,
        indoorOutdoor: e.target.indoorOutdoor.value,
        address: e.target.clubAddress.value,
        time: {
          startTime: e.target.startTime.value,
          endTime: e.target.endTime.value,
        },
        date: {
          startDate: new Date(e.target.startDate.value),
          endDate: new Date(e.target.endDate.value),
        },
        weekdays: checkedWeekdays,
        price: e.target.clubPrice.value,
        coachName: e.target.coachName.value,
        secondCoachName: e.target.secondCoachName.value,
        holidaysExceptions: e.target.holidaysExceptions.value,
        meetingPoint: e.target.meetingPoint.value,
        comments: e.target.comments.value,
        playerType: e.target.playerType.value,
        playerGender: e.target.playerGender.value,
        registrationOpen: (e.target.registrationState.value === 'true'),
        visible: true,
        full: false,
      });

      const newDocRef = doc(collection(db, this.docRef.path, "internal"), 'internalData');
      await setDoc(newDocRef, {
        clubAdministrator: e.target.clubAdministrator.value,
        minimumPlayers: e.target.minimumPlayers.value,
        maximumPlayers: e.target.maximumPlayers.value,
        currentPlayers: 0,
        venueContact: e.target.venueContact.value,
        druzinaContact: e.target.druzinaContact.value,
        internalComments: e.target.internalComments.value,
        registrationTimestamp: serverTimestamp(),
      });

      // Handle toasts or notifications here
      this.props.getClubs()
      const clubsTab = new bootstrap.Tab(document.getElementById('clubs-tab'));
      clubsTab.show()
      this.props.showToast("success", "club_added", "success")
    } catch (error) {
      console.error('Error adding document and subcollection:', error);
      this.props.showToast("error", "something_went_wrong", "danger")
    }
  };

  
  render() {
    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const weekdayCheckboxes = weekdays.map((weekday, idx) => {
      return(
        <div className="form-check" key={idx}>
          <input className="form-check-input" type="checkbox" id={weekday} name={weekday}/>
          <label className="form-check-label" htmlFor={weekday}>
            {weekday}
          </label>
        </div>
      )
    })
    return (
      <>
        <div className="container mt-5">
          <form className="form-floating" onSubmit={this.registerClub}>
            
            <div className="form-floating mb-3">
              <input type="text" className="form-control mb-3" id="club-name" placeholder="zs lipence" name="clubName" required/>
              <label htmlFor="club-name">jmeno aktivity*</label>
            </div>

            <div className="form-floating">
              <select className="form-select mb-3" style={{height: "58px"}} aria-label=".form-select-lg example" defaultValue={""} id="indoorOutdoorSelect" name="indoorOutdoor" required>
                <option disabled hidden value={""}></option>
                <option value="indoor">indoor</option>
                <option value="outdoor">outdoor</option>
              </select>
              <label htmlFor="indoorOutdoorSelect">indoor or outdoor*</label>
            </div>

            <div className="form-floating mb-3">
              <input type="text" className="form-control mb-3" id="club-address" placeholder="zs lipence trelocvicna" name="clubAddress" required/>
              <label htmlFor="club-address">adresa hriste*</label>
            </div>

            <div  className="row">
              <div className="col-lg-3">
                <div className="form-floating mb-3">
                  <input type="time" className="form-control mb-3" id="start-time" name="startTime" required/>
                  <label htmlFor="start-time">cas zacatku*</label>
                </div>
              </div>

              <div className="col-lg-3">
                <div className="form-floating mb-3">
                  <input type="time" className="form-control mb-3" id="end-time" name="endTime" required/>
                  <label htmlFor="end-time">cas konce*</label>
                </div>
              </div>

              <div className="col-lg-3">
                <div className="form-floating mb-3">
                  <input type="date" className="form-control" id="start-date" name="startDate" required/>
                  <label htmlFor="start-date">datum zacatku*</label>
                </div>
              </div>

              <div className="col-lg-3">
                <div className="form-floating mb-3">
                  <input type="date" className="form-control" id="end-date" name="endDate" required/>
                  <label htmlFor="end-date">datum konce*</label>
                </div>
              </div>
            </div>

            <span className="mb-1">dny v tydnu*</span>
            <div className="d-flex justify-content-between mb-3 flex-wrap">
              {weekdayCheckboxes}
            </div>

            <div className="row">
              <div className="col-lg-3">
                <div className="form-floating mb-3">
                  <input type="number" className="form-control mb-3" id="minimum-players" min={0} placeholder="5" name="minimumPlayers" required/>
                  <label htmlFor="minimum-players">minimum-players*</label>
                </div>
              </div>

              <div className="col-lg-3">
                <div className="form-floating mb-3">
                  <input type="number" className="form-control mb-3" id="maximum-players" min={0} placeholder="20" name="maximumPlayers" required/>
                  <label htmlFor="maximum-players">maximum-players*</label>
                </div>
              </div>

              <div className="col-lg-3">
                <div className="form-floating mb-3">
                  <input type="number" className="form-control mb-3" id="club-price" placeholder="20" name="clubPrice" required/>
                  <label htmlFor="club-price">cena*</label>
                </div>
              </div>

              <div className="col-lg-3">
                <div className="form-floating">
                <select className="form-select form-select mb-3" style={{height: "58px"}} aria-label=".form-select example" defaultValue={""} id="playerTypeSelect" name="playerType" required>
                  <option disabled hidden value={""}></option>
                  <option value="kid">deti</option>
                  <option value="adult">dospeli</option>
                  <option value="both">deti i dospeli</option>
                </select>
                <label htmlFor="playerTypeSelect">{t("player_type", this.props.lang)}*</label>
                </div>
              </div>
            </div>

            <div className="col-lg-3">
              <div className="form-floating">
              <select className="form-select form-select mb-3" style={{height: "58px"}} aria-label=".form-select example" defaultValue={""} id="playerGenderSelect" name="playerGender" required>
                <option disabled hidden value={""}></option>
                <option value="woman">{t("woman", this.props.lang)}</option>
                <option value="men">{t("men", this.props.lang)}</option>
                <option value="both">{t("both", this.props.lang)}</option>
              </select>
              <label htmlFor="playerGenderSelect">{t("player_gender", this.props.lang)}*</label>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-6">
                <div className="form-floating mb-3">
                  <input type="text" className="form-control mb-3" id="venue-contact" placeholder="+6552+2" name="venueContact" required/>
                  <label htmlFor="venue-contact">venue-contact*</label>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="form-floating mb-3">
                  <input type="text" className="form-control mb-3" id="druzina-contact" placeholder="65161" name="druzinaContact"/>
                  <label htmlFor="druzina-contact">druzina-contact</label>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-6">
                <div className="form-floating mb-3">
                  <input type="text" className="form-control mb-3" id="coach-name" placeholder="+6552+2" name="coachName" required/>
                  <label htmlFor="coach-name">jmeno trenera*</label>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="form-floating mb-3">
                  <input type="text" className="form-control mb-3" id="second-coach-name" placeholder="65161" name="secondCoachName"/>
                  <label htmlFor="second-coach-name">jmeno druheho trenera</label>
                </div>
              </div>
            </div>

            <div className="form-floating mb-3">
              <input type="text" className="form-control mb-3" id="club-administrator" placeholder="ben odvedle" name="clubAdministrator" required/>
              <label htmlFor="club-administrator">activity administrator*</label>
            </div>

            <div className="form-floating mb-3">
              <textarea className="form-control" onInput={(e) => autoGrow(e)} id="holidays-exceptions" rows="3" placeholder="nic" name="holidaysExceptions"/>
              <label htmlFor="holidays-exceptions">vyjimky na prazdniny</label>
            </div>

            <div className="form-floating mb-3">
              <input type="text" className="form-control mb-3" id="meeting-point" placeholder="zs lipence" name="meetingPoint" required/>
              <label htmlFor="meeting-point">misto setkani*</label>
            </div>

            <div className="form-floating mb-3">
              <textarea className="form-control" onInput={(e) => autoGrow(e)} id="comments" rows="3" placeholder="nic" name="comments"/>
              <label htmlFor="comments">comments</label>
            </div>

            <div className="form-floating mb-3">
              <textarea className="form-control" onInput={(e) => autoGrow(e)} id="internal-comments" rows="3" placeholder="nic" name="internalComments"/>
              <label htmlFor="internal-comments">internal-comments</label>
            </div>

            <div className="col-lg-3">
              <div className="form-floating">
              <select className="form-select form-select mb-3" style={{height: "58px"}} aria-label="form-select registration-state" defaultValue={""} id="registrationStateSelect" name="registrationState" required>
                <option disabled hidden value={""}></option>
                <option value={true}>{t("open", this.props.lang)}</option>
                <option value={false}>{t("close", this.props.lang)}</option>
              </select>
              <label htmlFor="registrationStateSelect">{t("registration_state", this.props.lang)}*</label>
              </div>
            </div>

            <div className="text-end mb-5 mt-3">
              <button type="button" className="btn btn-lg btn-secondary me-5" onClick={this.backToClubList}>{t("cancel", this.props.lang)}</button>
              <button type="submit" className="btn btn-lg btn-primary">{t("submit", this.props.lang)}</button>
            </div>
          </form>
        </div>
      </>
    );
  }
}

export default AddClub
