const sqlite3 = require("sqlite3").verbose()
const recordedCameras = ["0.0.0.0", "10.20.100.40", "10.20.100.42", "10.20.100.43"]
const compress_buffer = require("./compress_buffer")

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

async function save_to_debugDB(snapshot) {
	const compressed_buffer = await compress_buffer(snapshot.buffer)
	snapshot.buffer = compressed_buffer
	const {camera_ip, time_index, received, buffer, detections, detectedBy, detectedTime} = snapshot
	db[camera_ip].run(
		`insert INTO snapshots(camera_ip, time_index, received, buffer, detections, detectedBy, detectedTime) VALUES (?,?,?,?,?,?,?)`,
		[camera_ip, time_index.toString(), received, buffer, JSON.stringify(detections), detectedBy, detectedTime],
		(err) => { if (err) console.log(err.message) }
	)
}

module.exports = {db, save_to_debugDB}