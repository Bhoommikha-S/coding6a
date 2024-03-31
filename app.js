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
    stateId = obj.state_id,
    stateName = obj.state_name,
    population = obj.population,
  }
}
const district = obj => {
  return {
    districtId = obj.district_id,
    districtName = obj.district_name,
    stateId = obj.state_id,
    cases = obj.population,
    cured = obj.cured,
    active = obj.active,
    deaths = obj.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const query = `SELECT * FROM state;`
  const result = await db.all(query)
  response.send(result.map(i => dbToResponseObj(i),),)
})

app.get('/states/:stateId/', async (request,response)=>{
  const {stateId} = request.params
  const query = `SELECT * FROM state WHERE state_id = ${stateId}`
  const result = await db.get(query)
  response.send(result.map(i=> dbToResponseObj(i)))
})

app.post('/districts/',async(request,response){
  const {districtName,stateId,cases,cured,active,deaths} = request.body
  const query = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) 
  VALUES (${districtName},${stateId},${cases},${cured},${active},${deaths})`
  await db.run(query)
  response.send('District Successfully Added')
})
  
app.get('/districts/:districtId/', async (request,response)=>{
  const {districtId} = request.params
  const query = `SELECT * FROM district WHERE district_id = ${districtId}
  `
  const result = await db.get(query)
  response.send(district(result))
})

module.exports = app
