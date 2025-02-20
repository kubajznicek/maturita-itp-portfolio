import React, { Component } from "react"
import { doc, getDocs, query, collection, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged }from "firebase/auth";
import { auth, db } from "./FirebaseConfig"
import ToastComponent from './components/ToastComponent'; // Adjust the path
import { logEnvironment } from "./Functions";

import Parents from "./pages/Parents"
import Officials from "./pages/Officials"
import Auth from "./pages/Auth"

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      userDocument: null,
      user: null,
      lang: "cs",
      clubs: [],
    }
    this.toastRef = React.createRef();
  }

  componentDidMount () {
    logEnvironment()
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({user}, () => {
          this.getUserDocument()
        })
      }
      this.getClubs()
    });
  }

  getClubs = async () => {
    let clubs = []
    try {
      const querySnapshot = await getDocs(query(collection(db, "clubs"),where("registrationOpen", "==", true)))
      querySnapshot.forEach((doc) => {
        clubs.push({id: doc.id, data: doc.data()})
      })
      this.setState({
        clubs: clubs
      })
    }
    catch (error) {
      console.error(error)
    }
  }


  languageChange = (language) => {
    this.setState({
      lang: language
    })
  }

  getUserDocument = () => {
    const userRef = doc(db, "users", auth.currentUser.uid);
  
    // Set up Firestore listener
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        this.setState({
          userDocument: docSnap.data(),
        });
      } else {
        // Handle the case where the document doesn't exist
        console.error("User document does not exist.");
      }
    });
  
    // Store the unsubscribe function in the component's state or elsewhere
    this.setState({
      unsubscribeUserDocument: unsubscribe,
    });
  };

  showToast = (heading, message, type) => {
    this.toastRef.current.show(heading, message, type);
  };

  conditionalRender() {
    if (this.state.user == null) {
      return (
        <Auth lang={this.state.lang} clubs={this.state.clubs} languageChange={this.languageChange} showToast={this.showToast}/>
      )
    } else if(this.state.userDocument?.role === "parent") {
      return (
        <Parents lang={this.state.lang} clubs={this.state.clubs} languageChange={this.languageChange} userPlayers={this.state.userDocument.players} showToast={this.showToast}/>
      )
    } else if( this.state.userDocument?.role === "official") {
      return (
        <Officials lang={this.state.lang} languageChange={this.languageChange} showToast={this.showToast}/>
      )
    }
  }


  render() {
    return (
      <>
        {this.conditionalRender()}
        <ToastComponent ref={this.toastRef} lang={this.state.lang} />
      </>
    )
  }
}

export default App