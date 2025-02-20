import React, { Component } from "react";
import { db } from "../FirebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import { t } from "../Functions";
import ProblemsModal from "../components/ProblemsModal";

import Registration from "./parents/Registration";
import Players from "./parents/Players";
import Profile from "./parents/Profile";
import Offers from "./parents/Offers";
import ClubRegistration from "./parents/ClubRegistration";

import "../styles/Parents.scss";

class Parents extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
      player: {},
    };
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.userPlayers !== this.props.userPlayers) {
      await this.getPlayers();
    }
  }

  getPlayers = async () => {
    // function that reads players based on id in props.userPlayers and sets them to state.players
    let players = [];
    try {
      for (let i = 0; i < this.props.userPlayers.length; i++) {
        const playerRef = doc(db, "players", this.props.userPlayers[i]);
        const playerSnap = await getDoc(playerRef);
        if (playerSnap.exists()) {
          players.push({ id: playerSnap.id, data: playerSnap.data() });
        }
      }
      this.setState({
        players: players,
      });
    } catch (error) {
      console.error(error);
    }
  };

  setPlayer = (player) => {
    this.setState({
      player: player,
    });
  };

  render() {
    return (
      <>
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
          <div className="container-fluid">
            <div className="navbar-brand">
              <img src="images/kacr-logo.png" className="" height={50} alt="logo" />
              <span className="ms-3">KRIKETzone</span>
            </div>

            {/* --------tlacitko pro responzivitu------- */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse nav navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <a className="nav-link active" id="players-tab" data-bs-toggle="tab" data-bs-target="#players-tab-pane" type="button" role="tab" aria-controls="players-tab-pane" aria-selected="false">
                    {t("players", this.props.lang)}
                  </a>
                </li>
                <li className="nav-item d-none">
                  <a className="nav-link" id="club-registration-tab" data-bs-toggle="tab" data-bs-target="#club-registration-tab-pane" type="button" role="tab" aria-controls="club-registration-tab-pane" aria-selected="true">
                    {t("club_registration", this.props.lang)}
                  </a>
                </li>
                <li className="nav-item d-none">
                  <a className="nav-link" id="registration-tab" data-bs-toggle="tab" data-bs-target="#registration-tab-pane" type="button" role="tab" aria-controls="registration-tab-pane" aria-selected="true">
                    {t("registration", this.props.lang)}
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" id="offers-tab" data-bs-toggle="tab" data-bs-target="#offers-tab-pane" type="button" role="tab" aria-controls="offers-tab-pane" aria-selected="false">
                    {t("offers", this.props.lang)}
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile-tab-pane" type="button" role="tab" aria-controls="profile-tab-pane" aria-selected="false">
                    {t("profile", this.props.lang)}
                  </a>
                </li>
              </ul>
              <button type="button" className="btn btn-outline-danger ms-auto" data-bs-toggle="modal" data-bs-target="#problemsModal">
                {t("having_problems", this.props.lang)} ?
              </button>
              <form className="ms-3" role="search">
                <select className="form-select" aria-label="language select" defaultValue={this.props.lang} onChange={(e) => this.props.languageChange(e.target.value)}>
                  <option value="cs">🇨🇿 &nbsp; Česky</option>
                  <option value="en">🇬🇧 &nbsp; English</option>
                </select>
              </form>
            </div>
          </div>
        </nav>

        <div className="tab-content" id="myTabContent">
          <div className="tab-pane fade mt-5 show active" id="players-tab-pane" role="tabpanel" aria-labelledby="players-tab" tabIndex="0">
            {" "}
            <Players players={this.state.players} getPlayers={this.getPlayers} lang={this.props.lang} player={this.state.player} setPlayer={this.setPlayer} clubs={this.props.clubs} showToast={this.props.showToast} />{" "}
          </div>
          <div className="tab-pane fade mt-5" id="club-registration-tab-pane" role="tabpanel" aria-labelledby="club-registration-tab" tabIndex="0">
            {" "}
            <ClubRegistration getPlayers={this.getPlayers} lang={this.props.lang} player={this.state.player} setPlayer={this.setPlayer} clubs={this.props.clubs} showToast={this.props.showToast} />{" "}
          </div>
          <div className="tab-pane fade" id="registration-tab-pane" role="tabpanel" aria-labelledby="registration-tab" tabIndex="0">
            {" "}
            <Registration getPlayers={this.getPlayers} lang={this.props.lang} showToast={this.props.showToast}/>{" "}
          </div>
          <div className="tab-pane fade mt-5" id="offers-tab-pane" role="tabpanel" aria-labelledby="offers-tab" tabIndex="0">
            {" "}
            <Offers clubs={this.props.clubs} lang={this.props.lang} />{" "}
          </div>
          <div className="tab-pane fade mt-5" id="profile-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabIndex="0">
            {" "}
            <Profile lang={this.props.lang} showToast={this.props.showToast}/>{" "}
          </div>
        </div>

        <ProblemsModal lang={this.props.lang} />
      </>
    );
  }
}

export default Parents;
