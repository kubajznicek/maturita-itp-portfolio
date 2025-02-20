import React, { Component } from 'react'
import { db } from '../FirebaseConfig';
import { getDocs, query, collection } from 'firebase/firestore';
import { t } from '../Functions'

import Clubs from './officials/Clubs';
import AddClub from './officials/AddClub';
import ProblemsModal from '../components/ProblemsModal';

import Profile from './parents/Profile'

// import '../styles/Officials.scss'


class Officials extends Component {

  constructor(props) {
    super(props);
    this.state = {
      
    };
  }

  getClubs = async () => {
    let clubs = [];
    const querySnapshot = await getDocs(query(collection(db, "clubs")));

    for (const doc of querySnapshot.docs) {
        const clubData = doc.data();

        // Fetch "internal" subcollection data for each club
        const internalSubcollectionRef = doc.ref.path + "/internal";
        const internalDocSnapshot = await getDocs(collection(db, internalSubcollectionRef));

        let internalData = {};
        if (!internalDocSnapshot.empty) {
            internalData = internalDocSnapshot.docs[0].data();
        }

        clubs.push({ id: doc.id, data: clubData, internalData });
    }

    this.setState({
        clubs: clubs
    });
  }





  render() {
    return (
      <>
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
          <div className="container-fluid">
            <div className="navbar-brand">
              <img src="images/kacr-logo.png" className="" height={50} alt="logo"/>
              <span className="ms-3 text-capitalize">kriket Zone internal</span>
            </div>

            {/* --------tlacitko pro responzivitu------- */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse nav navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <a className="nav-link active" id="clubs-tab" data-bs-toggle="tab" data-bs-target="#clubs-tab-pane" type="button" role="tab" aria-controls="clubs-tab-pane" aria-selected="true">{t("clubs", this.props.lang)}</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile-tab-pane" type="button" role="tab" aria-controls="profile-tab-pane" aria-selected="false">{t("profile", this.props.lang)}</a>
                </li>
                <li className="nav-item d-none">
                  <a className="nav-link" id="add-club-tab" data-bs-toggle="tab" data-bs-target="#add-club-tab-pane" type="button" role="tab" aria-controls="add-club-tab-pane" aria-selected="false">add club</a>
                </li>
              </ul>
              <button type="button" className="btn btn-outline-danger ms-auto" data-bs-toggle="modal" data-bs-target="#problemsModal">{t("having_problems", this.props.lang)} ?</button>
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
          <div className="tab-pane fade show active" id="clubs-tab-pane" role="tabpanel" aria-labelledby="clubs-tab" tabIndex="0"> <Clubs lang={this.props.lang} showToast={this.props.showToast}/> </div>
          <div className="tab-pane fade mt-5" id="profile-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabIndex="0"> <Profile lang={this.props.lang} showToast={this.props.showToast}/> </div>
          <div className="tab-pane fade" id="add-club-tab-pane" role="tabpanel" aria-labelledby="add-club-tab" tabIndex="0"> <AddClub lang={this.props.lang} getClubs={this.getClubs} showToast={this.props.showToast}/> </div>
        </div>


        <ProblemsModal lang={this.props.lang}/>
      </>
    )
  }
}

export default Officials
