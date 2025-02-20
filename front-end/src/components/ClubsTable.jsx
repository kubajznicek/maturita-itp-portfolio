import React, { useState, useEffect } from "react";
import { useReactTable, createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { collection, getDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import ToastComponent from "./ToastComponent";
import { t, autoGrow } from "../Functions";

const columnHelper = createColumnHelper();

function ClubsTable({ data, lang, updateClubTable, showToast }) {
  // console.log("ClubsTable data:", data)

  if (!data) {
    console.error("no data");
    return null;
  }

  const [playersData, setPlayersData] = useState([]);
  const [clubData, setClubData] = useState({});
  const [contactsData, setContactsData] = useState({}); // {druzinaContact: "", venueContact: ""}
  const [toastHeading, setToastHeading] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [player, setPlayer] = useState({});
  const [club, setClub] = useState({});
  const [clubRegistrationOpen, setClubRegistrationOpen] = useState(clubData.registrationOpen);

  const handleRegistrationStateChange = (event) => {
    setClubRegistrationOpen(event.target.value === "true");
  };

  const [columnResizeMode, setColumnResizeMode] = React.useState("onChange");
  const [, rerender] = React.useReducer(() => ({}), {});

  useEffect(() => {
    const editClubModal = document.querySelector("#editClubModal");

    const updateModalClose = () => {
      setClubData({}); // Call setClubData({}) when the modal is closed
    };

    if (editClubModal) {
      // Add event listener when the modal element exists
      editClubModal.addEventListener("hidden.bs.modal", updateModalClose);
    }

    // Cleanup the event listener when the component unmounts
    return () => {
      if (editClubModal) {
        editClubModal.removeEventListener("hidden.bs.modal", updateModalClose);
      }
    };
  }, []);

  /**
   *
   * @param {} clubID
   * @description Fetches players ids in club from firestore
   * @returns [playersIDs]
   */

  const getPlayerIDs = async (clubID) => {
    try {
      // get player document in internal subcollection of club document
      const docRef = doc(db, "clubs", clubID, "internal", "players");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // console.log("Document data:", docSnap.data());
      } else {
        // doc.data() will be undefined in this case
        // create empty document
        await updateDoc(docRef, {
          players: [],
        });
      }

      const fetchedPlayersIDs = docSnap.data().players;
      return fetchedPlayersIDs;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const showContactsModal = async (id) => {
    const club = data.find((club) => club.id === id);
    setContactsData({ druzinaContact: club.internal.druzinaContact, venueContact: club.internal.venueContact });
    try {
      const contactsModal = document.getElementById("contactsModal");
      const contactsModalInstance = new bootstrap.Modal(contactsModal);
      contactsModalInstance.show();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const showPlayerModal = async (id) => {
    try {
      const fetchedPlayerIDs = await getPlayerIDs(id);
      const fetchedPlayersData = await Promise.all(
        fetchedPlayerIDs.map(async (playerID) => {
          const docRef = doc(db, "players", playerID);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // console.log("Document data:", docSnap.data());
            return { data: docSnap.data(), id: playerID };
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        })
      );
      setClub(data.find((club) => club.id === id))
      console.log("fetchedPlayersData:", fetchedPlayersData);
      setPlayersData(fetchedPlayersData); // Update state with fetched players data
      const playersModal = document.getElementById("playersModal");
      const playersModalInstance = new bootstrap.Modal(playersModal);
      playersModalInstance.show();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const closePlayersModal = () => {
    const playersModal = document.getElementById("playersModal");
    const playersModalInstance = bootstrap.Modal.getOrCreateInstance(playersModal);
    playersModalInstance.hide();
  };

  const copyEmails = async (data) => {
    try {
      // map player.contact.email and player.contact.secondEmail to array
      const emails = data.map((player) => player.data.contact.email);
      const secondEmails = data.map((player) => player.data.contact.secondEmail);
      // filter out empty strings
      const filteredEmails = emails.filter((email) => email !== "");
      const filteredSecondEmails = secondEmails.filter((email) => email !== "");
      // merge arrays
      const mergedEmails = filteredEmails.concat(filteredSecondEmails);
      // filter out duplicates
      const uniqueEmails = [...new Set(mergedEmails)];

      const emailsString = uniqueEmails.join(", ");
      navigator.clipboard.writeText(emailsString);
      closePlayersModal();
      showToast("emails_copied", "emails_copied_text", "success");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const copyPhones = async (data) => {
    try {
      const phones = data.map((player) => player.data.contact.phone);
      const phonesString = phones.join(", ");
      navigator.clipboard.writeText(phonesString);
      closePlayersModal();
      showToast("phones_copied", "phones_copied_text", "success");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deletePlayerFromClub = async () => {
    const response = await fetch(process.env.REACT_APP_FUNCTION_URL + "removePlayerFromClub", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerID: player.id, clubID: club.id }),
    });
    if (response.status === 200) {
      showToast("player_deleted", "player_deleted_from_club_text", "success");
      updateClubTable();
    } else {
      showToast("error", "error_text", "danger");
    }
  };

  const editClub = async (id) => {
    try {
      const clubData = data.find((club) => club.id === id);
      setClubData(JSON.parse(JSON.stringify(clubData)));
      const editClubModal = document.getElementById("editClubModal");
      const editClubModalInstance = new bootstrap.Modal(editClubModal);
      editClubModalInstance.show();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const editFormSubmit = async (e) => {
    e.preventDefault();
    const clubId = clubData.id;
    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const checkedWeekdays = [];
    weekdays.forEach((weekday) => {
      if (e.target[weekday].checked) {
        checkedWeekdays.push(weekday);
      }
    });
    try {
      await updateDoc(doc(db, "clubs", clubId), {
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
        registrationOpen: e.target.registrationState.value === "true",
      });
      await updateDoc(doc(db, "clubs", clubId, "internal", clubData.internalId), {
        clubAdministrator: e.target.clubAdministrator.value,
        minimumPlayers: e.target.minimumPlayers.value,
        maximumPlayers: e.target.maximumPlayers.value,
        venueContact: e.target.venueContact.value,
        druzinaContact: e.target.druzinaContact.value,
        internalComments: e.target.internalComments.value,
        updatedTimestamp: serverTimestamp(),
      });
      updateClubTable();
      showToast("club_updated", "club_updated_text", "success");
      const editClubModal = document.getElementById("editClubModal");
      const editClubModalInstance = bootstrap.Modal.getOrCreateInstance(editClubModal);
      editClubModalInstance.hide();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRegistrationChange = (event) => {
    const newValue = event.target.value === "true"; // Convert to boolean
    setClubData({ ...clubData, registrationOpen: newValue });
  };

  const handleIndoorOutdoorChange = (event) => {
    setClubData({ ...clubData, indoorOutdoor: event.target.value });
  };

  const handlePlayerTypeChange = (event) => {
    setClubData({ ...clubData, playerType: event.target.value });
  };

  const handlePlayerGenderChange = (event) => {
    setClubData({ ...clubData, playerGender: event.target.value });
  };

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("registrationOpen", {
        header: "Registration",
        cell: (info) => {
          return info.getValue() == true ? <div className="container-fluid bg-success">Ano</div> : <div className="container-fluid bg-warning">Ne</div>;
        },
      }),
      columnHelper.accessor("id", {
        id: (id) => `players-${id}`,
        header: "hraci",
        cell: (info) => (
          <button className="btn btn-primary btn-sm" onClick={() => showPlayerModal(info.getValue())}>
            ukazat hrace <span className="badge text-bg-secondary">{data.find((club) => club.id === info.getValue()).internal.currentPlayers}</span>
          </button>
        ),
      }),
      columnHelper.accessor("address", {
        header: "Address",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("meetingPoint", {
        header: "misto setkani",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("internal.clubAdministrator", {
        header: "Club Administrator",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("coachName", {
        header: "jmeno trenera",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("secondCoachName", {
        header: "jmeno druheho trenera",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("weekdays", {
        header: "dny v tydnu",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("startTime", {
        header: "cas zacatku",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("price", {
        header: "cena CZK",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("startDate", {
        header: "datum zacatku",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("comments", {
        header: "Comments",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("internal", {
        header: "Capacity",
        cell: (info) => info.getValue().minimumPlayers + " - " + info.getValue().maximumPlayers,
      }),
      columnHelper.accessor("id", {
        id: (id) => `contacts-${id}`,
        header: "Contacts",
        cell: (info) => (
          <button className="btn btn-primary btn-sm" onClick={() => showContactsModal(info.getValue())}>
            interni kontakty
          </button>
        ),
      }),
      columnHelper.accessor("internal.internalComments", {
        header: "Internal Comments",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("id", {
        id: (id) => `edit-${id}`,
        header: "Edit",
        cell: (info) => (
          <button className="btn btn-secondary btn-sm" onClick={() => editClub(info.getValue())}>
            edit
          </button>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    columnResizeMode,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false,
    debugHeaders: false,
    debugColumns: false,
  });

  // function Filter({ column, table }) {
  //   const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id);

  //   const columnFilterValue = column.getFilterValue();

  //   return typeof firstValue === "number" ? (
  //     <div className="d-flex">
  //       <input type="number" value={columnFilterValue?.[0] ?? ""} onChange={(e) => column.setFilterValue((old) => [e.target.value, old?.[1]])} placeholder={`Min`} className="w-24 border shadow rounded" />
  //       <input type="number" value={columnFilterValue?.[1] ?? ""} onChange={(e) => column.setFilterValue((old) => [old?.[0], e.target.value])} placeholder={`Max`} className="w-24 border shadow rounded" />
  //     </div>
  //   ) : (
  //     <input type="text" value={columnFilterValue ?? ""} onChange={(e) => column.setFilterValue(e.target.value)} placeholder={`Hledat...`} className="w-36 border shadow rounded" />
  //   );
  // }

  const players = playersData.map((player) => {
    let playerData = player.data;

    return (
      <div className="row flex-nowrap" key={player.id}>
        <p className="col-sm-2 col-6">
          {playerData.name.firstName} {playerData.name.middleName} {playerData.name.lastName}
        </p>
        <p className="col-sm-2 col-6">{playerData?.parentName}</p>
        <p className="col-sm-2 col-6">
          {playerData?.schoolClubSelect == "true" ? <span className="container-fluid bg-success">Ano</span> : <span className="container-fluid bg-warning">Ne</span>}
          {playerData?.schoolClubDepartment == "" ? "" : ", " + playerData?.schoolClubDepartment}
        </p>
        <p className="col-sm-3 col-6">
          {playerData.contact.phone}
          {playerData.contact.secondPhone !== "" ? ", " + playerData.contact.secondPhone : ""}
        </p>
        <p className="col-sm-5 col-6">
          {playerData.contact.email}
          {playerData.contact.secondEmail !== "" ? ", " + playerData.contact.secondEmail : ""}
        </p>
        <div className="col-1">
          <button className="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#deletePlayerModal" onClick={() => setPlayer(player)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3-fill" viewBox="0 0 16 16">
              <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  });

  const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const weekdayCheckboxes = weekdays.map((weekday, idx) => {
    return (
      <div className="form-check" key={idx}>
        <input className="form-check-input" type="checkbox" defaultChecked={clubData.weekdays?.includes(weekday)} id={weekday} name={weekday} />
        <label className="form-check-label" htmlFor={weekday}>
          {weekday}
        </label>
      </div>
    );
  });

  const editClubForm = (
    <form className="form-floating" onSubmit={editFormSubmit}>
      <div className="form-floating mb-3">
        <input type="text" className="form-control mb-3" id="club-name" placeholder="zs lipence" name="clubName" defaultValue={clubData.name} required />
        <label htmlFor="club-name">jmeno aktivity*</label>
      </div>

      <div className="form-floating">
        <select className="form-select mb-3" style={{ height: "58px" }} aria-label=".form-select-lg example" value={clubData.indoorOutdoor} onChange={handleIndoorOutdoorChange} id="indoorOutdoorSelect" name="indoorOutdoor" required>
          <option value="indoor">indoor</option>
          <option value="outdoor">outdoor</option>
        </select>
        <label htmlFor="indoorOutdoorSelect">indoor or outdoor*</label>
      </div>

      <div className="form-floating mb-3">
        <input type="text" className="form-control mb-3" id="club-address" placeholder="zs lipence trelocvicna" name="clubAddress" defaultValue={clubData.address} required />
        <label htmlFor="club-address">adresa hriste*</label>
      </div>

      <div className="row">
        <div className="col-lg-3">
          <div className="form-floating mb-3">
            <input type="time" className="form-control mb-3" id="start-time" name="startTime" defaultValue={clubData.startTime} required />
            <label htmlFor="start-time">cas zacatku*</label>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="form-floating mb-3">
            <input type="time" className="form-control mb-3" id="end-time" name="endTime" defaultValue={clubData.endTime} required />
            <label htmlFor="end-time">cas konce*</label>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="form-floating mb-3">
            <input type="date" className="form-control" id="start-date" name="startDate" defaultValue={clubData.date?.startDate ? new Date(clubData.date.startDate.seconds * 1000).toISOString().slice(0, 10) : ""} required />
            <label htmlFor="start-date">datum zacatku*</label>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="form-floating mb-3">
            <input type="date" className="form-control" id="end-date" name="endDate" defaultValue={clubData.date?.endDate ? new Date(clubData.date.endDate.seconds * 1000).toISOString().slice(0, 10) : ""} required />
            <label htmlFor="end-date">datum konce*</label>
          </div>
        </div>
      </div>

      <span className="mb-1">dny v tydnu*</span>
      <div className="d-flex justify-content-between mb-3 flex-wrap">{weekdayCheckboxes}</div>

      <div className="row">
        <div className="col-lg-3">
          <div className="form-floating mb-3">
            <input type="number" className="form-control mb-3" id="minimum-players" min={0} placeholder="5" name="minimumPlayers" defaultValue={clubData.internal?.minimumPlayers} required />
            <label htmlFor="minimum-players">minimum-players*</label>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="form-floating mb-3">
            <input type="number" className="form-control mb-3" id="maximum-players" min={0} placeholder="20" name="maximumPlayers" defaultValue={clubData.internal?.maximumPlayers} required />
            <label htmlFor="maximum-players">maximum-players*</label>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="form-floating mb-3">
            <input type="number" className="form-control mb-3" id="club-price" placeholder="20" name="clubPrice" defaultValue={clubData.price} required />
            <label htmlFor="club-price">price*</label>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="form-floating">
            <select className="form-select form-select mb-3" style={{ height: "58px" }} aria-label=".form-select example" value={clubData.playerType} onChange={handlePlayerTypeChange} id="playerTypeSelect" name="playerType" required>
              <option disabled hidden value={""}></option>
              <option value="kid">deti</option>
              <option value="adult">dospeli</option>
              <option value="both">deti i dospeli</option>
            </select>
            <label htmlFor="playerTypeSelect">{t("player_type", lang)}*</label>
          </div>
        </div>
      </div>

      <div className="col-lg-3">
        <div className="form-floating">
          <select className="form-select form-select mb-3" style={{ height: "58px" }} aria-label=".form-select example" value={clubData.playerGender} onChange={handlePlayerGenderChange} id="playerGenderSelect" name="playerGender" required>
            <option disabled hidden value={""}></option>
            <option value="woman">{t("woman", lang)}</option>
            <option value="men">{t("men", lang)}</option>
            <option value="both">{t("both", lang)}</option>
          </select>
          <label htmlFor="playerGenderSelect">{t("player_gender", lang)}*</label>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="form-floating mb-3">
            <input type="text" className="form-control mb-3" id="venue-contact" placeholder="+6552+2" name="venueContact" defaultValue={clubData.internal?.venueContact} required />
            <label htmlFor="venue-contact">venue-contact*</label>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="form-floating mb-3">
            <input type="text" className="form-control mb-3" id="druzina-contact" placeholder="65161" name="druzinaContact" defaultValue={clubData.internal?.druzinaContact} />
            <label htmlFor="druzina-contact">druzina-contact</label>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="form-floating mb-3">
            <input type="text" className="form-control mb-3" id="coach-name" placeholder="+6552+2" name="coachName" defaultValue={clubData.coachName} required />
            <label htmlFor="coach-name">jmeno trenera*</label>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="form-floating mb-3">
            <input type="text" className="form-control mb-3" id="second-coach-name" placeholder="65161" name="secondCoachName" defaultValue={clubData.secondCoachName} />
            <label htmlFor="second-coach-name">jmeno druheho trenera</label>
          </div>
        </div>
      </div>

      <div className="form-floating mb-3">
        <input type="text" className="form-control mb-3" id="club-administrator" placeholder="ben odvedle" name="clubAdministrator" defaultValue={clubData.internal?.clubAdministrator} required />
        <label htmlFor="club-administrator">activity administrator*</label>
      </div>

      <div className="form-floating mb-3">
        <textarea className="form-control" onInput={(e) => autoGrow(e)} id="holidays-exceptions" rows="3" placeholder="nic" defaultValue={clubData.holidaysExceptions} name="holidaysExceptions" />
        <label htmlFor="holidays-exceptions">vyjimky na prazdniny</label>
      </div>

      <div className="form-floating mb-3">
        <input type="text" className="form-control mb-3" id="meeting-point" placeholder="zs lipence" name="meetingPoint" defaultValue={clubData.meetingPoint} required />
        <label htmlFor="meeting-point">misto setkani*</label>
      </div>

      <div className="form-floating mb-3">
        <textarea className="form-control" onInput={(e) => autoGrow(e)} id="comments" rows="3" placeholder="nic" defaultValue={clubData.comments} name="comments" />
        <label htmlFor="comments">comments</label>
      </div>

      <div className="form-floating mb-3">
        <textarea className="form-control" onInput={(e) => autoGrow(e)} id="internal-comments" rows="3" placeholder="nic" defaultValue={clubData.internal?.internalComments} name="internalComments" />
        <label htmlFor="internal-comments">internal-comments</label>
      </div>

      <div className="col-lg-3">
        <div className="form-floating">
          <select className="form-select form-select mb-3" style={{ height: "58px" }} aria-label="form-select registration-state" value={clubData.registrationOpen} onChange={handleRegistrationChange} id="registrationStateSelect" name="registrationState" required>
            <option disabled hidden value={""}></option>
            <option value={true}>{t("open", lang)}</option>
            <option value={false}>{t("close", lang)}</option>
          </select>
          <label htmlFor="registrationStateSelect">{t("registration_state", lang)}*</label>
        </div>
      </div>

      <div className="text-end mt-3">
        <button type="button" className="btn btn btn-secondary me-3" data-bs-dismiss="modal">
          {t("cancel", lang)}
        </button>
        <button type="submit" className="btn btn btn-primary">
          {t("submit", lang)}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <table
        className="border"
        {...{
          style: {
            width: table.getCenterTotalSize(),
          },
        }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className="bg-secondary-subtle border border-secondary"
                  {...{
                    key: header.id,
                    colSpan: header.colSpan,
                    style: {
                      width: header.getSize(),
                    },
                  }}>
                  <div>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    {/* {header.column.getCanFilter() ? (
                      <div>
                        <Filter column={header.column} table={table} />
                      </div>
                    ) : null} */}
                    {/* {
                      onMouseDown: header.getResizeHandler(),
                      onTouchStart: header.getResizeHandler(),
                      className: `resizer ${header.column.getIsResizing() ? "isResizing" : ""}`,
                      style: {
                        transform: columnResizeMode === "onEnd" && header.column.getIsResizing() ? `translateX(${table.getState().columnSizingInfo.deltaOffset}px)` : "",
                      },
                    } */}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  className={`border border-secondary ${row.index % 2 === 0 ? "bg-info-subtle" : ""}`}
                  {...{
                    key: cell.id,
                    style: {
                      width: cell.column.getSize(),
                    },
                  }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="d-flex gap-2 my-2">
        <button className="border rounded p-1" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
          {"<<"}
        </button>
        <button className="border rounded p-1" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {"<"}
        </button>
        <button className="border rounded p-1" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {">"}
        </button>
        <button className="border rounded p-1" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
          {">>"}
        </button>
        <span className="d-flex align-items-center gap-1">
          <div>{t("page", lang)}</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | {t("go_to_page", lang)}:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}>
          {[5, 10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {t("show", lang)} {pageSize}
            </option>
          ))}
        </select>
      </div>

      {/* -PLAYERS-MODAL- */}
      <div className="modal fade" id="playersModal" tabIndex="-1" aria-labelledby="playersModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="playersModalLabel">
                Players
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body" style={{ overflowX: "scroll" }}>
              <div className="modal-body" style={{ width: "100%" }}>
                <div className="container-fluid">
                  <div className="row flex-nowrap">
                    <div className="col-sm-2 col-6">
                      <strong>Name</strong>
                    </div>
                    <div className="col-sm-2 col-6">
                      <strong>Parent name</strong>
                    </div>
                    <div className="col-sm-2 col-6">
                      <strong>Druzina</strong>
                    </div>
                    <div className="col-sm-3 col-6">
                      <strong>Phone</strong>
                    </div>
                    <div className="col-sm-5 col-6">
                      <strong>Email</strong>
                    </div>
                  </div>
                  {players}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-indigo" onClick={() => copyEmails(playersData)}>
                Copy emails
              </button>
              <button className="btn btn-indigo" onClick={() => copyPhones(playersData)}>
                Copy phones
              </button>
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -DELETE-PLAYER-MODAL- */}
      <div className="modal fade" id="deletePlayerModal" tabIndex="-1" aria-labelledby="deletePlayerModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="deletePlayerModal">
                {t("delete_player_from_club", lang)}
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="modal-body">
                {t("delete_player", lang)}{" "}
                <strong className="text-capitalize">{player.data?.name.firstName} {player.data?.name.middleName} {player.data?.name.lastName} </strong>
                {t("from_club", lang)}
                <strong> {club?.name}</strong>?
                {t("action_non_returnable", lang)}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={deletePlayerFromClub}>
                {t("delete_player", lang)}
              </button>
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                {t("cancel", lang)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -CONTACTS-MODAL- */}
      <div className="modal fade" id="contactsModal" tabIndex="-1" aria-labelledby="contactsModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="contactsModalLabel">
                Internal contacts
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-sm-6 d-flex flex-column mb-md-0 mb-3">
                      <strong>druzinaContact</strong>
                      <span>{contactsData.druzinaContact}</span>
                    </div>
                    <div className="col-sm-6 d-flex flex-column mb-md-0 mb-3">
                      <strong>venueContact</strong>
                      <span>{contactsData.venueContact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -EDIT-CLUB-MODAL- */}
      <div className="modal fade" id="editClubModal" tabIndex="-1" aria-labelledby="editClubModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="editClubModalLabel">
                Edit club
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="modal-body">
                {/* <div className="container-fluid"> */}
                {editClubForm}
                {/* </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

export default ClubsTable;
