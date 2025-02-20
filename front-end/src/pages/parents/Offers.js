import React, { Component } from "react"
import { t } from "../../Functions"
import ClubList from "../../components/ClubList"

import "../../styles/Clubs.scss"


class Offers extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  render() {
    return (
      <>
        <div className="position-fixed z-n1 container-fluid h-100 icon-background">
          <img src="images/bat_drawing.png" alt="bat drawing" className="position-absolute start-3"/>
          <img src="images/bat_drawing.png" alt="bat drawing" className="position-absolute end-20 bottom-15"/>
          <img src="images/bat_drawing.png" alt="bat drawing" className="position-absolute start-50 top-10"/>
          <img src="images/wicket_drawing.png" alt="bat drawing" className="position-absolute bottom-15"/>
        </div>
        <div className="d-flex justify-content-center container-sm">
          <div className="accordion container" id="accordionclubs">
            {this.props.clubs ? <ClubList clubs={this.props.clubs} lang={this.props.lang}/> : null}
          </div>
        </div>
      </>
    )
  }
}

export default Offers
