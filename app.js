const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

//DB init
let db = null

const dbInit = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server running at http://localhost:3000'),
    )
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}

dbInit()

const dbToResponseObj = obj => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  }
}
const district = obj => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.population,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const query = `SELECT * FROM state;`
  const result = await db.all(query)
  response.send(result.map(i => dbToResponseObj(i)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const query = `SELECT * FROM state WHERE state_id = '${stateId}'`
  const result = await db.get(query)
  response.send(dbToResponseObj(result))
})

app.post('/districts/', async (request, response) => {
  const {stateId, districtName, cases, cured, active, deaths} = request.body
  const query = `INSERT INTO district ( state_id,district_name, cases, cured, active, deaths) 
  VALUES (${stateId},'${districtName}',${cases},${cured},${active},${deaths});`
  await db.run(query)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const query = `SELECT * FROM district WHERE district_id = '${districtId}'`
  const result = await db.get(query)
  response.send(district(result))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const query = `DELETE FROM district WHERE district_id = '${districtId}'`
  await db.run(query)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const query = `UPDATE district SET district_name = '${districtName}', state_id = '${stateId}', 
  cases = '${cases}', cured = '${cured}', active = '${active}', deaths = '${deaths}'
   WHERE district_id = '${districtId}'`
  await db.run(query)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const query = `SELECT SUM(cases), SUM(cured), SUM(active),SUM(deaths) FROM district WHERE state_id = '${stateId}'`
  const stats = await db.get(query)
  response.send({
    totalCases: stats['SUM(totalCases)'],
    totalCured: stats['SUM(totalCured)'],
    totalActive: stats['SUM(totalActive)'],
    totalDeaths: stats['SUM(totalDeaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const query = `SELECT state_name FROM state NATURAL JOIN district ON district_id = '${districtId}'`
  const result = db.get(query)
  response.send({
    stateName: result.state_name,
  })
})

module.exports = app
