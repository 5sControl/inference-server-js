const sqlite3 = require("sqlite3").verbose()
const compress_buffer = require("./compress_buffer")

function createDB(camera_ip) {
	const db = new sqlite3.Database(`images/${camera_ip}.db`)
	db.run(`CREATE TABLE IF NOT EXISTS snapshots (
		received integer,
		buffer blob,
		detections text,
		detected_time integer
	) `)
	return db
}

let db = {}
for (const camera_ip of global.recordedCameras) {
	db[camera_ip] = createDB(camera_ip)
}

async function save_to_debugDB(snapshot, camera_ip) {
	const compressed_buffer = await compress_buffer(snapshot.buffer)
	snapshot.buffer = compressed_buffer
	const {received, buffer, detections, detected_time} = snapshot
	db[camera_ip].run(
		`insert INTO snapshots(received, buffer, detections, detected_time) VALUES (?,?,?,?,?,?,?)`,
		[received, buffer, JSON.stringify(detections), detected_time],
		(err) => { if (err) console.log(err.message) }
	)
}

module.exports = {db, save_to_debugDB}