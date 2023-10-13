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
	db.run(`CREATE TABLE IF NOT EXISTS screenshots (
		received integer,
		buffer blob
	) `)
	db.run(`CREATE TABLE IF NOT EXISTS camera_info (
		detected_by text,
		zones text
	) `)
	return db
}

let db = {}
for (const camera_ip of global.recordedCameras) {
	db[camera_ip] = createDB(camera_ip)
}

async function save_camera_info(camera_ip, camera_info) {
	db[camera_ip].run(
		`insert INTO camera_info(detected_by, zones) VALUES (?,?)`,
		[camera_info.detected_by, camera_info.zones],
		(err) => { if (err) console.log(err.message) }
	)
}
async function save_screenshot(camera_ip, received, buffer) {
	const compressed_buffer = await compress_buffer(buffer)
	db[camera_ip].run(
		`insert INTO screenshots(received, buffer) VALUES (?,?)`,
		[received, compressed_buffer],
		(err) => { if (err) console.log(err.message) }
	)
}
async function save_snapshot(snapshot, camera_ip) {
	const compressed_buffer = await compress_buffer(snapshot.buffer)
	snapshot.buffer = compressed_buffer
	const {received, buffer, detections, detected_time} = snapshot
	db[camera_ip].run(
		`insert INTO snapshots(received, buffer, detections, detected_time) VALUES (?,?,?,?,?,?,?)`,
		[received, buffer, JSON.stringify(detections), detected_time],
		(err) => { if (err) console.log(err.message) }
	)
}

module.exports = {save_camera_info, save_snapshot, save_screenshot}