import { t } from "../Functions"


function getClubItems(clubs, lang) {
    const clubsRender = clubs.map((club, idx) => {
        const startDate = new Date(club.data.date.startDate.seconds * 1000).toLocaleDateString("cs-CZ")
        const endDate = new Date(club.data.date.endDate.seconds * 1000).toLocaleDateString("cs-CZ")
        const playgroundType = club.data.playgroundType === "indoor" ? t("indoor_gym", lang) : t("outdoor_playground", lang)
        const gender = club.data.playerGender
        const weekdays = club.data.weekdays.map((day) => {
            return t(day + "_short", lang)
        }).join(", ")

        let playerType = "";
        if (club.data.playerType === "kid") {
            playerType = t("kids", lang);
        } else if (club.data.playerType === "adult") {
            playerType = t("adult", lang);
        } else if (club.data.playerType === "both") {
            playerType = t("kids_and_adults", lang);
        } else {
            playerType = t("unknown", lang);
        }

        return (
        <div className="accordion-item mb-3 border border-1 rounded-4 bg-secondary-subtle shadow" key={club.id}>
            <h2 className="accordion-header">
            <button className="accordion-button text-capitalize rounded-4 collapsed" type="button" data-bs-toggle="collapse" data-bs-target={"#clubs-collapse" + idx} aria-expanded="true" aria-controls={"panelsStayOpen-collapse" + idx}>
                <div className="d-flex container-fluid">
                    <div className="col-md-3">
                        {club.data.name}
                    </div>
                    <div className="col-md-2 lh-sm d-none d-sm-block">
                        {playerType}<br/>
                        {gender === "" ? "" :  t(gender, lang)}
                    </div>
                    <div className="col-md-1 ms-1 ms-md-0">
                        {weekdays}
                    </div>
                    <div className="d-none d-sm-block">
                        {club.data.time.startTime} - {club.data.time.endTime}
                    </div>
                    <div className="ms-3">
                        od {startDate.split(".")[0]}. {startDate.split(".")[1]}.
                    </div>
                </div>
            </button>
            </h2>
            <div id={"clubs-collapse" + idx} className="accordion-collapse collapse">
            <div className="accordion-body">
                <div className="row mb-3">
                    <div className="col-sm-2"><strong >{t("address", lang)}:</strong></div><div className="me-5 col">{club.data.address}</div>
                    <div className="col-sm-2"><strong >{t("meeting_point", lang)}:</strong></div><div className="me-5 col">{club.data.meetingPoint}</div>
                </div>
                <div className="row mb-3">
                    <div className="col-sm-2"><strong >{t("date", lang)}:</strong></div><div className="me-5 col">{startDate} - {endDate}</div>
                    <div className="col-sm-2"><strong >{t("playground_type", lang)}:</strong></div><div className="me-5 col">{playgroundType}</div>
                </div>
                <div className="row mb-3">
                    <div className="col-sm-2"><strong >{t("time", lang)}:</strong></div><div className="me-5 col">{club.data.time.startTime} - {club.data.time.endTime}</div>
                    <div className="col-sm-2"><strong >{t("players", lang)}:</strong></div><div className="me-5 col">{playerType}</div>
                </div>
                <div className="row mb-3">
                    <div className="col-sm-2"><strong >{t("coach", lang)}:</strong></div><div className="me-5 col">{club.data.coachName}</div>
                    <div className="col-sm-2"><strong >{t("player_gender", lang)}:</strong></div><div className="me-5 col">{t(gender, lang)}</div>
                </div>
                <div className="row mb-3">
                    <div className="col-sm-2"><strong >{t("second_coach", lang)}:</strong></div><div className="me-5 col">{club.data.secondCoachName}</div>
                    <div className="col-sm-2"><strong >{t("price", lang)}:</strong></div><div className="me-5 col">{club.data.price} Kč</div>
                </div>
                <div className="d-flex">
                    <div>
                        <strong >{t("comments", lang)}:</strong>
                    </div>
                    <div className="ms-3">{club.data.comments}</div>
                </div>
            </div>
            </div>
        </div>
    )})
    return clubsRender
}

function ClubList({clubs, lang}) {
    clubs = getClubItems(clubs, lang)
  return (
    <div className="accordion" id="accordionclubs">
      {clubs?.length === 0 ? <div className="text-center">{t("no_clubs_to_list", lang)}</div> : clubs}
    </div>
  )
}

export default ClubList;