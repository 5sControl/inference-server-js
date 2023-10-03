const sqlite3 = require("sqlite3").verbose()
const recordedCameras = ["0.0.0.0", "10.20.100.40", "10.20.100.42", "10.20.100.43"]

function createDB(camera_ip) {
	const db = new sqlite3.Database(`images/${camera_ip}.db`)
	db.run(`CREATE TABLE IF NOT EXISTS snapshots (
		camera_ip text,
		time_index text,
		received integer,
		buffer blob,
		detections text,
		detectedBy text,
		detectedTime integer
	) `)
	return db
}

let db = {}
for (const camera_ip of recordedCameras) {
	db[camera_ip] = createDB(camera_ip)
}

module.exports = db