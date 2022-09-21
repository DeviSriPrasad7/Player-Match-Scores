const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB ERROR:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayers = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayers);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const player = await database.get(getPlayer);
  response.send(convertPlayerDetailsDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    UPDATE
      player_details
    SET 
      player_name = '${playerName}'
    WHERE
      player_id = ${playerId};`;
  await database.run(updatePlayer);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const match = await database.get(getMatch);
  response.send(convertMatchDetailsDbObjectToResponseObject(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
    SELECT
      *
    FROM
      player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const player = await database.all(getPlayerMatches);
  response.send(
    player.map((eachPlayer) =>
      convertMatchDetailsDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayers = `
    SELECT
      *
    FROM
      player_match_score 
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const player = await database.all(getMatchPlayers);
  response.send(
    player.map((eachPlayer) =>
      convertPlayerDetailsDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersScores = `
    SELECT
      player_id AS playerId, 
      player_name AS playerName, 
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM 
      player_match_score NATURAL JOIN player_details
    WHERE
      player_id =${playerId};`;
  const player = await database.get(getPlayersScores);
  response.send(player);
});
module.exports = app;
