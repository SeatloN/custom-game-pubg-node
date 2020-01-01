const fs = require('fs')
const path = require('path')
const ENV = require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const compression = require('compression')
const bodyParser = require('body-parser')
const axios = require('axios')
const CircularJSON = require('circular-json')
const moment = require('moment')
const _ = require('lodash')
const pubg = require('pubg.js')
const ApiKey = process.env.PUBG_API_KEY;
let port = 3000;
var CustomMatchArray = [];
var simplePlayerArray = [];
var mat = [];
// Logging setup
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
// Init
const app = express()
app.use(morgan('combined', { stream: accessLogStream }))
app.use(bodyParser.json(['*/json']))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(compression())
app.use(cors())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// Running things that does not require API-Token
// Checking API status
app.get('/status', (req, res) => {
	axios.get('https://api.pubg.com/status')
	  .then(function (response) {
	    // handle success
	    res.json({status:`Status OK`, data: response.data})
			//console.log(response.data);
	  })
	  .catch(function (error) {
		// handle error
		res.send({status:`Status OK`, data: response.data, error: response.error})
		//console.log(error);
	})
});
// Player lookup using playerName
app.post('/player', (req, res) => {
	const client = new pubg.Client(`${ApiKey}`, `${req.body.shard}`);
	if (req.query.use === 'name' || req.query.use === undefined) {
		const player = client.getPlayer({ name: `${req.body.username}` })
			.then(player => {
				const playerId = player.id; // Define playerId
				const playerName = player.attributes.name; // Define playerName
				const playerShard = player.attributes.shardId; // Define playerShard
				async function playedMatches() {
					console.log('Started...')
					const matches = player.relationships.matches; // Define all Matches
					for (const match of matches) {
						const content = await client.getMatch(match.id, `${playerShard}`).catch(err => console.log(err))
						console.log(content.id)
						if (content.attributes.isCustomMatch == true) {
							CustomMatchArray.push(content) // Pushing the match to the array before sorting it by date.
							var rosters = content.relationships.rosters; // Defining the Rosters of the match before going through them.
							rosters.forEach(roster => {
								var participants = roster.relationships.participants; // Defining the Players of a roster.
								participants.forEach(participant => {
									if (participant.attributes.stats.playerId == playerId) {
										let displayMap = content.attributes.mapName;
										let createdAt = moment.utc(content.attributes.createdAt).format("Do MMM YYYY, HH:mm"); // Creating a new time to be read
										let gamemode = content.attributes.gameMode; // Creating a variable before converting it.
										let displayGameMode = gamemode; // Converting the variable 
										let matchAttributes = roster.attributes.stats; // Getting Roster Attributes
										simplePlayerArray.push({ matchId: content.id, matchCreatedAt: createdAt, matchCreatedAtSort: content.attributes.createdAt, matchMapName: displayMap, matchGameMode: displayGameMode, matchRosterAttributes: matchAttributes, matchStats: participant.attributes.stats })

										function sortFunction(a, b) {
											var dateA = new Date(a.matchCreatedAtSort).getTime();
											var dateB = new Date(b.matchCreatedAtSort).getTime();
											return dateA > dateB ? -1 : 1;
										}
										simplePlayerArray.sort(sortFunction)
									}
								})
							})
						}
						function sortFunction(a, b) {
							var dateA = new Date(a.attributes.createdAt).getTime();
							var dateB = new Date(b.attributes.createdAt).getTime();
							return dateA > dateB ? -1 : 1;
						}
						CustomMatchArray.forEach(item => {
							var rosters = item.relationships.rosters;
							function sortFunctionRank(a, b) {
								return a.attributes.stats.rank > b.attributes.stats.rank ? 1 : -1;
							}
							rosters.sort(sortFunctionRank)
						})
						CustomMatchArray.sort(sortFunction)
					}
					console.log('Ended...')
					SendResponse()
				}
				playedMatches()
				function SendResponse() {
					res.json({ playerId: playerId, playerName: playerName, playerShard: playerShard, matchesObject: CustomMatchArray, fastArray: simplePlayerArray, timestamp: Date.now() })
					console.log('Package has been sent!')
				}
			})
			.catch(error => console.log(error) + res.json(error))
		CustomMatchArray = [];
		simplePlayerArray = [];
	}
	if (req.query.use === 'id') {
		const player = client.getPlayer({ id: `${req.body.uid}` })
			.then(player => {
				const playerId = player.id; // Define playerId
				const playerName = player.attributes.name; // Define playerName
				const playerShard = player.attributes.shardId; // Define playerShard
				async function playedMatches() {
					console.log('Started...')
					const matches = player.relationships.matches; // Define all Matches
					for (const match of matches) {
						const content = await client.getMatch(match.id, `${playerShard}`).catch(err => console.log(err))
						console.log(content.id)
						if (content.attributes.isCustomMatch == true) {
							CustomMatchArray.push(content) // Pushing the match to the array before sorting it by date.
							var rosters = content.relationships.rosters; // Defining the Rosters of the match before going through them.
							rosters.forEach(roster => {
								var participants = roster.relationships.participants; // Defining the Players of a roster.
								participants.forEach(participant => {
									if (participant.attributes.stats.playerId == playerId) {
										let displayMap = content.attributes.mapName;
										let createdAt = moment.utc(content.attributes.createdAt).format("Do MMM YYYY, HH:mm"); // Creating a new time to be read
										let gamemode = content.attributes.gameMode; // Creating a variable before converting it.
										let displayGameMode = gamemode; // Converting the variable 
										let matchAttributes = roster.attributes.stats; // Getting Roster Attributes
										simplePlayerArray.push({ matchId: content.id, matchCreatedAt: createdAt, matchCreatedAtSort: content.attributes.createdAt, matchMapName: displayMap, matchGameMode: displayGameMode, matchRosterAttributes: matchAttributes, matchStats: participant.attributes.stats })

										function sortFunction(a, b) {
											var dateA = new Date(a.matchCreatedAtSort).getTime();
											var dateB = new Date(b.matchCreatedAtSort).getTime();
											return dateA > dateB ? -1 : 1;
										}
										simplePlayerArray.sort(sortFunction)
									}
								})
							})
						}
						function sortFunction(a, b) {
							var dateA = new Date(a.attributes.createdAt).getTime();
							var dateB = new Date(b.attributes.createdAt).getTime();
							return dateA > dateB ? -1 : 1;
						}
						CustomMatchArray.forEach(item => {
							var rosters = item.relationships.rosters;
							function sortFunctionRank(a, b) {
								return a.attributes.stats.rank > b.attributes.stats.rank ? 1 : -1;
							}
							rosters.sort(sortFunctionRank)
						})
						CustomMatchArray.sort(sortFunction)
					}
					console.log('Ended...')
					SendResponse()
				}
				playedMatches()
				function SendResponse() {
					res.json({ playerId: playerId, playerName: playerName, playerShard: playerShard, matchesObject: CustomMatchArray, fastArray: simplePlayerArray, timestamp: Date.now() })
					console.log('Package has been sent!')
				}
			})
			.catch(error => console.log(error) + res.json(error))
		CustomMatchArray = [];
		simplePlayerArray = [];
	}
	if (req.query.use === 'simple') {
		const player = client.getPlayer({ name: `${req.body.username}` })
			.then(player => {
				const playerId = player.id; // Define playerId
				const playerName = player.attributes.name; // Define playerName
				const playerShard = player.attributes.shardId; // Define playerShard
				async function playedMatches() {
					console.log('Started...')
					const matches = player.relationships.matches; // Define all Matches
					for (const match of matches) {
						const content = await client.getMatch(match.id, `${playerShard}`).catch(err => console.log(err))
						console.log(content.id)
						if (content.attributes.isCustomMatch == true) {
							var rosters = content.relationships.rosters; // Defining the Rosters of the match before going through them.
							rosters.forEach(roster => {
								var participants = roster.relationships.participants; // Defining the Players of a roster.
								participants.forEach(participant => {
									if (participant.attributes.stats.playerId == playerId) {
										let displayMap = content.attributes.mapName;
										let createdAt = moment.utc(content.attributes.createdAt).format("Do MMM YYYY, HH:mm"); // Creating a new time to be read
										let gamemode = content.attributes.gameMode; // Creating a variable before converting it.
										let displayGameMode = gamemode; // Converting the variable 
										let matchAttributes = roster.attributes.stats; // Getting Roster Attributes
										simplePlayerArray.push({ matchId: content.id, matchCreatedAt: createdAt, matchCreatedAtSort: content.attributes.createdAt, matchMapName: displayMap, matchGameMode: displayGameMode, matchRosterAttributes: matchAttributes, matchStats: participant.attributes.stats })

										function sortFunction(a, b) {
											var dateA = new Date(a.matchCreatedAtSort).getTime();
											var dateB = new Date(b.matchCreatedAtSort).getTime();
											return dateA > dateB ? -1 : 1;
										}
										simplePlayerArray.sort(sortFunction)
									}
								})
							})
						}
						function sortFunction(a, b) {
							var dateA = new Date(a.attributes.createdAt).getTime();
							var dateB = new Date(b.attributes.createdAt).getTime();
							return dateA > dateB ? -1 : 1;
						}
					}
					console.log('Ended...')
					SendResponse()
				}
				playedMatches()
				function SendResponse() {
					res.json({ playerId: playerId, playerName: playerName, playerShard: playerShard, fastArray: simplePlayerArray, timestamp: Date.now() })
					console.log('Package has been sent!')
				}
			})
			.catch(error => console.log(error) + res.json(error))
		simplePlayerArray = [];
	}
})

app.post('/match', (req, res) => {
	const client = new pubg.Client(`${ApiKey}`, `${req.body.shard}`)
	if (req.query.use === 'single' || req.query.use === undefined) {
		async function fetchMatch() {
			console.log('Started...')
			var matchId = req.body.matchid;
			var matchShard = req.body.shard;
			const content = await client.getMatch(matchId, `${matchShard}`).catch(err => console.log(err))
			console.log(content.id)
			var rosters = content.relationships.rosters;
			function sortFunctionRank(a, b) {
				return a.attributes.stats.rank > b.attributes.stats.rank ? 1 : -1;
			}
			rosters.sort(sortFunctionRank)
			console.log('Ended...')
			SendResponse(content)
		}
		fetchMatch()
		function SendResponse(content) {
			res.json({ match: content, timestamp: Date.now() })
			console.log('Package has been sent!')
		}
	}
	if (req.query.use === 'multi') {
		var matchShard = req.body.shard;
		let matchesArray = [];
		let matches = req.body.matchIds;
		async function fetchMatches() {
			console.log('Started...')
			for (match of matches) {
				const content = await client.getMatch(match, `${matchShard}`).catch(err => console.log(err))
				console.log(content.id)
				var rosters = content.relationships.rosters;
				function sortFunctionRank(a, b) {
					return a.attributes.stats.rank > b.attributes.stats.rank ? 1 : -1;
				}
				rosters.sort(sortFunctionRank)
				matchesArray.push(content)
			}
			function sortFunctionDate(a, b) {
				var dateA = new Date(a.attributes.createdAt).getTime();
				var dateB = new Date(b.attributes.createdAt).getTime();
				return dateA > dateB ? -1 : 1;
			}
			matchesArray.sort(sortFunctionDate)
			console.log('Ended...')
			SendResponse(matchesArray)
		}
		fetchMatches()
		function SendResponse(matchesArray) {
			res.json({ matches: matchesArray, timestamp: Date.now() })
			console.log('Package has been sent!')
		}
	}
})

app.post('/telemetry', (req, res) => {
	const client = new pubg.Client(`${ApiKey}`)
	const telemetryUrl = req.body.telemetryUrl;
	let LOGMATCHDEFINITION = [];// _T: "LogMatchDefinition"
	let LOGGAMESTATEPERIODIC = []; // _T : "LogGameStatePeriodic"
	let LOGMATCHSTART = []; // _T : "LogMatchStart"
	let LOGPLAYEREVENT = []; // _T : "LogPlayerKill",_T : "LogPlayerMakeGroggy", _T : "LogPlayerRevive"

	async function fetchTelemetry() {
		console.log('Started...')
		const telemetry = await client.getTelemetry(telemetryUrl).catch(err => console.log(err))
		for (const event of telemetry) {
			// Create new array's with the objects that we want to keep. First we want to get the circle and other information from the 10 sec intervall of the telemetry logging of this object
			if (event._T == "LogMatchDefinition") {
				LOGMATCHDEFINITION.push(event)
			}
			if (event._T == "LogGameStatePeriodic") {
				LOGGAMESTATEPERIODIC.push(event)
			}
			// Secound we log all information about the match start.
			if (event._T == "LogMatchStart") {
				LOGMATCHSTART.push(event)
			}
			// Third we log all Kill, Groggy, Revives events 
			if (event._T == "LogPlayerKill" || event._T == "LogPlayerMakeGroggy" || event._T == "LogPlayerRevive") {
				LOGPLAYEREVENT.push(event)
			}
		}
		console.log('Ended...')

		SendResponse(LOGMATCHDEFINITION, LOGGAMESTATEPERIODIC, LOGMATCHSTART, LOGPLAYEREVENT)
	}
	fetchTelemetry()
	function SendResponse(LOGMATCHDEFINITION, LOGGAMESTATEPERIODIC, LOGMATCHSTART, LOGPLAYEREVENT) {
		res.json({ "matchDefinition": LOGMATCHDEFINITION, "gameStatePeriodic": LOGGAMESTATEPERIODIC, "matchStart": LOGMATCHSTART, "matchEvents": LOGPLAYEREVENT })
		console.log('Package has been sent!')
	}
	LOGMATCHDEFINITION = [];
	LOGGAMESTATEPERIODIC = [];
	LOGMATCHSTART = [];
	LOGPLAYEREVENT = [];
})

app.post('/tournaments', (req, res) => {
	let tournamentIds = []
	const client = new pubg.Client(`${ApiKey}`)
	async function fetchTournaments() {
		console.log('Started tournaments fetch...')
		const tournaments = await client.getTournaments().catch(err => console.log(err))
		for (const tournament of tournaments) {
			tournamentIds.push(tournament.id)
		}
		console.log('Ended...')
		SendResponse(tournamentIds)
	}
	fetchTournaments()
	function SendResponse(tournamentIds) {
		res.json(tournamentIds)
		console.log('Package has been sent!')
	}
})

app.post('/tournament', (req, res) => {
	const id = req.body.id
	const shard = "tournament"
	let matchArray = []
	const client = new pubg.Client(`${ApiKey}`)
	async function fetchTournament() {
		console.log('Started tournament fetch...')
		const tournament = await client.getTournament(id).catch(err => console.log(err))
		const matches = tournament.relationships.matches
		for (const matchObj of matches) {
			const match = await client.getMatch(matchObj.id, shard).catch(err => console.log(err))
			var rosters = match.relationships.rosters;
			function sortFunctionRank(a, b) {
				return a.attributes.stats.rank > b.attributes.stats.rank ? 1 : -1;
			}
			rosters.sort(sortFunctionRank)
			matchArray.push(match)
		}
		function sortFunctionDate(a, b) {
			var dateA = new Date(a.attributes.createdAt).getTime();
			var dateB = new Date(b.attributes.createdAt).getTime();
			return dateA > dateB ? -1 : 1;
		}
		matchArray.sort(sortFunctionDate)
		console.log('Ended...')
		SendResponse(tournament, matchArray)
	}
	fetchTournament()
	function SendResponse(tournament, matchArray) {
		res.json({ "tournament": tournament.id, "matchdata": matchArray })
		console.log('Package has been sent!')
	}
})

app.listen(port, () => console.log(`App is listening on port ${port}`))