import React, { Component } from 'react'
import { db } from '../../FirebaseConfig';
import { getDocs, getDoc, doc, query, collection } from 'firebase/firestore';
import ToastComponent from "../../components/ToastComponent"
import { t } from '../../Functions';
import ClubsTable from '../../components/ClubsTable';


class Clubs extends Component {

  constructor(props) {
    super(props);
    this.state = {
      
    };
  }

  componentDidMount() {
    this.getClubs()
      .then(clubs => {
        this.getDataForTable(clubs);
      });
  }

  addClub () {
    const registrationTab = new bootstrap.Tab(document.getElementById('add-club-tab'));
    registrationTab.show()
  }

  getClubs = () => {
    return new Promise(async (resolve, reject) => {
      try {
        let clubs = [];
        const querySnapshot = await getDocs(query(collection(db, "clubs")));
        querySnapshot.forEach(doc => {
          clubs.push({ id: doc.id, data: doc.data() });
        });
        this.setState({ clubs: clubs });
        resolve(clubs);
      } catch (error) {
        reject(error);
      }
    });
  };

  getClubInternal = (clubId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const docSnapshot = await getDoc(doc(db, "clubs", clubId, "internal", "internalData"));  // Get the document
        const internalData = {id: docSnapshot.id, data: docSnapshot.data()}  // Get the data
        resolve(internalData);
      } catch (error) {
        reject(error);
      }
    });
  };
  

  async getDataForTable(clubs) {
    const mappedDataPromises = clubs.map(async club => {
      const clubData = club.data;
      const internalData = await this.getClubInternal(club.id);
  
      const startDate = new Date(clubData.date.startDate.seconds * 1000).toLocaleDateString("cs-CZ");
      const endDate = new Date(clubData.date.endDate.seconds * 1000).toLocaleDateString("cs-CZ");
  
      return {
        id: club.id,  // Including the ID from the club object
        internal: internalData.data,
        internalId: internalData.id,
        name: clubData.name,
        address: clubData.address,
        registrationOpen: clubData.registrationOpen,
        clubAdministrator: clubData.clubAdministrator,
        coachName: clubData.coachName,
        secondCoachName: clubData.secondCoachName,
        playerType: clubData.playerType,
        playerGender: clubData.playerGender,
        indoorOutdoor: clubData.indoorOutdoor,
        weekdays: clubData.weekdays.join(", "),
        startTime: clubData.time.startTime,
        endTime: clubData.time.endTime,
        startDate: startDate,
        endDate: endDate,
        price: clubData.price,
        date: clubData.date,
        holidaysExceptions: clubData.holidaysExceptions,
        meetingPoint: clubData.meetingPoint,
        comments: clubData.comments,
      };
    });
  
    const data = await Promise.all(mappedDataPromises);
  
    this.setState({ tableData: data });
  }
  
  updateClubTable = () => {
    this.getClubs()
      .then(clubs => {
        this.getDataForTable(clubs);
      }
    );
  }

  
  
  render() {
    const spinner = (
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    )
    return (
      <>
        <div className="mt-3 container-fluid" style={{overflowX: "scroll"}}>
          {/* -----table----- */}
          {this.state.tableData ? <ClubsTable data={this.state.tableData} lang={this.props.lang} updateClubTable={this.updateClubTable} showToast={this.props.showToast}/> : spinner}

        </div>

        {/* -----add player button----- */}
        <button className="btn btn-primary circular-btn position-fixed" onClick={this.addClub}>
          <i className="fas fa-plus scale-2"></i>
        </button>

      </>
    );
  }
}

export default Clubs
