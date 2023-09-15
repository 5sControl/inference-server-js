const sqlite3 = require('sqlite3').verbose()
let db = new sqlite3.Database('debug/debugDB.db')
db.run(`CREATE TABLE IF NOT EXISTS snapshots (
	camera_ip text,
    time_index text,
	buffer blob,
	detections text
) `)

module.exports = db