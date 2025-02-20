/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Timestamp, FieldValue } = require("firebase-admin/firestore");
admin.initializeApp();
const db = admin.firestore();

async function setUpCORSSettings(request, response) {
  // Set up CORS headers
  response.header("Access-Control-Allow-Origin", process.env.CORS_ALLOWED_ORIGIN);

  if (request.method === "OPTIONS") {
    // Handle preflight request
    response.header("Access-Control-Allow-Methods", "POST");
    response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.status(204).send(); // Send response here for preflight requests
    return true;
  }
}

async function createUserDocument(user) {
  const userData = {
    language: "cs", // Assuming this is a fixed value
    role: "parent", // Assuming this is a fixed value
    createdAt: Timestamp.now(),
    players: [],
  };

  try {
    const db = admin.firestore();
    const userDocRef = db.collection("users").doc(user.uid);

    await userDocRef.set(userData);

    logger.log(`User document ${user.uid} created successfully`);
  } catch (error) {
    logger.error("Error creating user document:", error);
  }
}

exports.addUserDocument = functions.auth.user().onCreate((user) => {
  return createUserDocument(user);
});

exports.disableAccount = functions.runWith({ memory: "128MB", timeoutSeconds: 60 }).https.onRequest(async (request, response) => {
  if (await setUpCORSSettings(request, response)) {
    return; // Return if preflight request
  }

  try {
    const uid = request.body.uid;

    if (!uid) {
      return response.status(400).json({ message: "UID is required in the request body" });
    }

    try {
      logger.log("Fetching user record");
      // If the user exists, update the user
      await admin.auth().updateUser(uid, { disabled: true });
    } catch (error) {
      console.error("Error updating user:", error);
      // Handle the case where the user doesn't exist
      return response.status(404).json({ error: "User not found" });
    }

    return response.json({ message: "Account disabled successfully" });
  } catch (error) {
    console.error("Error disabling account:", error);
    return response.status(500).json({ error: "An error occurred" });
  }
});

exports.addPlayerToClub = functions.runWith({ memory: "128MB", timeoutSeconds: 60 }).https.onRequest(async (request, response) => {
  if (await setUpCORSSettings(request, response)) {
    return; // Return if preflight request
  }

  const { clubID, playerID } = request.body;

  // check if clubID and playerID are in request body
  if (!clubID || !playerID) {
    return response.status(400).json({ error: "request body must contain clubID and playerID" });
  }

  try {
    const clubRef = db.collection("clubs").doc(clubID);
    const playersDocRef = clubRef.collection("internal").doc("players");

    await playersDocRef.get().then((docSnapshot) => {
      if (docSnapshot.exists) {
        // club already has players document
      } else {
        // create players document
        playersDocRef.set({
          players: [],
        });
      }
    });

    const playersDocumentSnapshot = await playersDocRef.get();
    const clubDocumentSnapshot = await clubRef.get();

    const players = playersDocumentSnapshot.data().players;

    if (players.includes(playerID)) {
      logger.warn(`Player ${playerID} already exists in club ${clubID}`);
      return response.status(409).json({ error: "Player already exists in club" });
    } else {
      // add club to player
      const playerDocRef = db.collection("players").doc(playerID);

      await playerDocRef.update({
        clubs: FieldValue.arrayUnion({
          id: clubID,
          name: clubDocumentSnapshot.data().name,
        }),
      });

      // add playerID to club
      await playersDocRef.update({
        players: FieldValue.arrayUnion(playerID),
      });

      //update "currentPlayer" field in the internal document
      const internalDocRef = db.collection("clubs").doc(clubID).collection("internal").doc("internalData");

      admin.firestore().runTransaction(async (transaction) => {
        const internalDocSnapshot = await transaction.get(internalDocRef);
        const newCurrentPlayers = (internalDocSnapshot.data().currentPlayers || 0) + 1; // increment currentPlayers by 1

        await transaction.update(internalDocRef, {
          currentPlayers: newCurrentPlayers,
        });
      });
    }
  } catch (error) {
    logger.error("Error adding player to club:", error, "clubID" + clubID, "playerID" + playerID);
    return response.status(500).json({ error: "An error occurred" });
  }

  logger.log(`Player ${playerID} added to club ${clubID} successfully`);
  return response.status(200).json({ message: "Player added to club successfully", playerId: playerID });
});

exports.removePlayerFromClub = functions.runWith({ memory: "128MB", timeoutSeconds: 60 }).https.onRequest(async (request, response) => {
  if (await setUpCORSSettings(request, response)) {
    return; // Return if preflight request
  }

  const { clubID, playerID } = request.body;

  // check if clubID and playerID are in request body
  if (!clubID || !playerID) {
    return response.status(400).json({ error: "request body must contain clubID and playerID" });
  }

  try {
    const clubRef = db.collection("clubs").doc(clubID);
    const playersDocRef = clubRef.collection("internal").doc("players");

    const clubDocSnapshot = await clubRef.get();
    const playersDocumentSnapshot = await playersDocRef.get();

    const playerDocRef = db.collection("players").doc(playerID);

    const players = playersDocumentSnapshot.data().players;

    if (players.includes(playerID)) {
      await playersDocRef.update({
        players: FieldValue.arrayRemove(playerID), // remove player from players array
      });
    } else {
      logger.warn(`Player ${playerID} doesn't exist in club ${clubID}`);
      return response.status(400).json({ error: "Player doesn't exist in club" });
    }

    // Update "currentPlayer" field in the single document
    const internalDocRef = db.collection("clubs").doc(clubID).collection("internal").doc("internalData");

    admin.firestore().runTransaction(async (transaction) => {
      const internalDocSnapshot = await transaction.get(internalDocRef);
      const newCurrentPlayers = (internalDocSnapshot.data().currentPlayers || 0) - 1; // decrease currentPlayers by 1

      await transaction.update(internalDocRef, {
        currentPlayers: newCurrentPlayers,
      });
    });

    // remove club from player
    await playerDocRef.update({
      // remove club from array of maps
      clubs: FieldValue.arrayRemove({
        id: clubID,
        name: clubDocSnapshot.data().name,
      }),
    });

    logger.log(`Player ${playerID} removed from club ${clubID} successfully`);
    return response.status(200).json({ message: "Player removed from club successfully", playerId: playerID });
  } catch (error) {
    logger.error(`Error removing player ${playerID} from club ${clubID}:`, error);
    return response.status(500).json({ error: "An error occurred" });
  }
});

exports.deletePlayer = functions.runWith({ memory: "256MB", timeoutSeconds: 60 }).https.onRequest(async (request, response) => {
  if (await setUpCORSSettings(request, response)) {
    return; // Return if preflight request
  }

  const data = JSON.parse(request.body.data);
  const { playerID, userID } = data;

  if (!playerID || !userID) {
    return response.status(400).json({ error: "request body must contain plyerID and userID" });
  }

  try {
    // get user document and check if player id id in an array called players
    const userDocRef = db.collection("users").doc(userID);
    const userDocSnapshot = await userDocRef.get();

    if (!userDocSnapshot.exists) {
      logger.warn(`User ${userID} doesn't exist`);
      return response.status(404).json({ error: "User not found" });
    }

    const userData = userDocSnapshot.data();
    const players = userData.players;

    //get player document and check if player exists
    const playerDocRef = db.collection("players").doc(playerID);
    const playerDocSnapshot = await playerDocRef.get();

    if (!playerDocSnapshot.exists) {
      logger.warn(`Player ${playerID} doesn't exist`);
      return response.status(404).json({ error: "Player not found" });
    }

    const playerData = playerDocSnapshot.data();

    if (players.includes(playerID)) {
      // check if player belongs to user
      if (playerData.clubs.length > 0) {
        // check if player doesn't have any clubs
        logger.warn(`Player ${playerID} has clubs, cannot delete`);
        return response.status(403).json({ error: "Player has clubs, cannot delete" });
      }

      await db
        .collection("users")
        .doc(userID)
        .update({
          players: FieldValue.arrayRemove(playerID),
        });
      await db.collection("players").doc(playerID).delete();
    } else {
      logger.warn(`Player ${playerID} doesn't belong to user ${userID}`);
      return response.status(400).json({ error: "Player not found, player doesn`t belong to user" });
    }
  } catch (error) {
    logger.error("Error deleting player:", error);
    return response.status(400).json({ error: "Error occurred while deleting player" + error });
  }

  logger.log(`Player ${playerID} deleted successfully`);
  return response.json({ message: "Player deleted successfully" });
});

exports.addPlayer = functions
  // function that triggers when new player is added to firestore players collection
  // it adds player to user document
  .runWith({ memory: "256MB", timeoutSeconds: 60 })
  .firestore.document("players/{playerID}")
  .onCreate(async (snapshot, context) => {
    const playerID = context.params.playerID;
    const playerData = snapshot.data();

    try {
      // get user document and check if player id id in an array called players
      playerData.userID.forEach(async (userID) => {
        let userDocRef = db.collection("users").doc(userID);
        let userDocSnapshot = await userDocRef.get();
        if (!userDocSnapshot.exists) {
          logger.warn(`User ${userID} doesn't exist`);
          return;
        }
        const userData = userDocSnapshot.data();
        const players = userData.players;

        if (!players.includes(playerID)) {
          // check if player belongs to user
          await db
            .collection("users")
            .doc(userID)
            .update({
              players: FieldValue.arrayUnion(playerID),
            });
          logger.log(`Player ${playerID} added to user ${userID} successfully`);
        } else {
          logger.warn(`Player ${playerID} already belongs to user ${userID}`);
        }
      });
    } catch (error) {
      logger.error("Error adding player to user:", error);
    }
  });

// function that checks if player club registration are correct
// verifi that player.clubs array is the same as club.players array
// if not, update club.players array to match player.clubs array (to mach what the users sees)

exports.countRegistrations = functions.runWith({ memory: "256MB", timeoutSeconds: 60 }).https.onRequest(async (request, response) => {
  if (await setUpCORSSettings(request, response)) {
    return; // Return if preflight request
  }

  try {
    // for each player in players collection
    // get player document
    // get player.clubs array
    // for each club in player.clubs array
    // get club document
    // get club.players array
    // if playerID is not in club.players array
    // add playerID to club.players array
    // if playerID is in club.players array
    // do nothing

    const playersCollectionRef = db.collection("players");
    const playersCollectionSnapshot = await playersCollectionRef.get();

    const players = playersCollectionSnapshot.docs.map((doc) => doc.data());
    const playersIDs = playersCollectionSnapshot.docs.map((doc) => doc.id);

    logger.log("found " + players.length + " players");

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const playerID = playersIDs[i];

      const playerClubs = player.clubs;

      if (playerClubs === undefined || playerClubs.length === 0) {
        continue;
      }

      for (let j = 0; j < playerClubs.length; j++) {
        const club = playerClubs[j];

        const clubID = club.id;

        const clubRef = db.collection("clubs").doc(clubID);
        const clubDocSnapshot = await clubRef.get();

        if (!clubDocSnapshot.exists) {
          logger.warn(`Club ${clubID} doesn't exist`);
          continue;
        }

        // get players document fomr internal subcollection
        const playersDocRef = clubRef.collection("internal").doc("players");
        const playersDocSnapshot = await playersDocRef.get();

        if (!playersDocSnapshot.exists) {
          logger.warn(`Club ${clubID} doesn't have players document`);
          continue;
        }

        const clubPlayers = playersDocSnapshot.data().players;

        if (!clubPlayers.includes(playerID)) {
          // check if player belongs to club
          try {
            await playersDocRef.update({
              players: FieldValue.arrayUnion(playerID),
            });
            logger.log(`Player ${playerID} added to club ${clubID} successfully`);
          } catch (error) {
            logger.error("Error adding player to club:", error);
          }
        }

        // if (!clubPlayers.includes(playerID)) {
        //   logger.log(`Player ${playerID} not in club ${clubID}`);
        // }
      }
    }
    return response.json({ message: "Counting club registrations" });
  } catch (error) {
    logger.error("Error counting club registrations:", error);
    return response.status(500).json({ error: "An error occurred" });
  }
});
