import React, { Component } from "react";
import { db } from "../../FirebaseConfig";
import { getDocs, doc, updateDoc, query, arrayUnion, collection, where } from "firebase/firestore";
import { t } from "../../Functions";

import "../../styles/Clubs.scss";

class ClubRegistration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clubs: [],
    };
  }

  componentDidMount() {
    // this.getSuitableClubs()
  }

  addPlayerToClub = async (clubID, player) => {
    const requestData = {
      clubID: clubID,
      playerID: player.id,
    };
    try {
      this.props.showToast("registration_sent", "please_wait", "success");
      const response = await fetch(process.env.REACT_APP_FUNCTION_URL + "addPlayerToClub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.status === 200) {
        this.props.showToast("registration_accepted", "player_club_list_tip", "success");
        this.props.getPlayers();
      } else if (response.status === 409) {
        this.props.showToast("error", "player_already_in_club", "warning");
      } else {
        this.props.showToast("error", "try_again", "danger");
      }
    } catch (error) {
      this.props.showToast("error", "try_again", "danger");
      console.error("Function call error:", error);
    }
  };

  // getSuitableClubs = async () => {                  // temporary disabled to minimalize number of firestore reads
  //   let clubs = []
  //   const querySnapshot = await getDocs(query(collection(db, "clubs"),where("registrationOpen", "==", true)))
  //   querySnapshot.forEach((doc) => {
  //     clubs.push({id: doc.id, data: doc.data()})
  //   })
  //   this.setState({
  //     clubs: clubs
  //   })
  // }

  register = async (club) => {
    try {
      this.returnToPlayers();
      this.addPlayerToClub(club.id, this.props.player)
      this.props.setPlayer({});
    } catch (error) {
      console.error("Error updating player document:", error);
    }
  };

  returnToPlayers = () => {
    const playerTab = new bootstrap.Tab(document.getElementById("players-tab"));
    playerTab.show();
  };

  render() {
    const resetRegistrationButton = (
      <button className="btn position-absolute return-button" onClick={this.returnToPlayers}>
        <span>
          <i className="fa fa-arrow-left fa-3x"></i>
        </span>
      </button>
    );

    const clubs = this.props.clubs.map((club, idx) => {
      const startDate = new Date(club.data.date.startDate.seconds * 1000).toLocaleDateString("cs-CZ");
      const endDate = new Date(club.data.date.endDate.seconds * 1000).toLocaleDateString("cs-CZ");
      const gender = club.data.playerGender == "both" ? "" : club.data.playerGender;
      const weekdays = club.data.weekdays
        .map((day) => {
          return t(day, this.props.lang);
        })
        .join(", ");

      let playerType = "";
      if (club.data.playerType === "kid") {
        playerType = t("kids", this.props.lang);
      } else if (club.data.playerType === "adult") {
        playerType = t("adult", this.props.lang);
      } else if (club.data.playerType === "both") {
        playerType = t("kids_and_adults", this.props.lang);
      } else {
        playerType = t("unknown", this.props.lang);
      }

      return (
        <div className="accordion-item mb-3 border border-1 rounded-4 bg-secondary-subtle shadow" key={club.id}>
          <h2 className="accordion-header">
            <button className="accordion-button text-capitalize rounded-4 collapsed" type="button" data-bs-toggle="collapse" data-bs-target={"#clubs-collapse" + idx} aria-expanded="true" aria-controls={"panelsStayOpen-collapse" + idx}>
              {`${club.data.name} \xa0\xa0 ${t(gender, this.props.lang)} \xa0\xa0\xa0\xa0\xa0 ${weekdays} ${club.data.time.startTime} - ${club.data.time.endTime}`}
            </button>
          </h2>
          <div id={"clubs-collapse" + idx} className="accordion-collapse collapse">
            <div className="accordion-body">
              <div className="parent-clubs mb-3">
                <div>
                  <strong>{t("address", this.props.lang)}:</strong>
                </div>
                <div className="me-5">{club.data.address}</div>
                <div>
                  <strong>{t("meeting_point", this.props.lang)}:</strong>
                </div>
                <div className="me-5">{club.data.meetingPoint}</div>
                <div>
                  <strong>{t("date", this.props.lang)}:</strong>
                </div>
                <div className="me-5">
                  {startDate} - {endDate}
                </div>
                <div>
                  <strong>{t("players", this.props.lang)}:</strong>
                </div>
                <div className="me-5">{playerType}</div>
                <div>
                  <strong>{t("coach", this.props.lang)}:</strong>
                </div>
                <div className="me-5">{club.data.coachName}</div>
                <div>
                  <strong>{t("price", this.props.lang)}:</strong>
                </div>
                <div className="me-5">{club.data.price} Kč</div>
              </div>
              <div className="d-flex">
                <div>
                  <strong>{t("comments", this.props.lang)}:</strong>
                </div>
                <div className="mx-3">{club.data.comments}</div>
              </div>
              <div className="d-flex">
                <button className="btn btn-primary ms-auto" type="button" onClick={() => this.register(club)}>
                  {t("register_player", this.props.lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    });

    return (
      <>
        {resetRegistrationButton}
        <div className="position-fixed z-n1 container-fluid h-100 icon-background">
          <img src="images/bat_drawing.png" alt="bat drawing" className="position-absolute start-3" />
          <img src="images/bat_drawing.png" alt="bat drawing" className="position-absolute end-20 bottom-15" />
          <img src="images/bat_drawing.png" alt="bat drawing" className="position-absolute start-50 top-10" />
          <img src="images/wicket_drawing.png" alt="bat drawing" className="position-absolute bottom-15" />
        </div>
        <div className="d-flex justify-content-center container-sm pt-5">
          <div className="accordion container pt-5" id="accordionclubs">
            {this.props.clubs.length === 0 ? <div className="text-center">{t("no_clubs_info", this.props.lang)}</div> : clubs}
          </div>
        </div>
      </>
    );
  }
}

export default ClubRegistration;
