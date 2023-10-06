const compress_buffer = require("./compress_buffer")
const db = require("../debugDB")

class Snapshot {
    constructor(camera_ip, time_index, buffer, received) {
        this.camera_ip = camera_ip
        this.time_index = time_index
        this.received = received
        this.buffer = buffer
        this.detections = []
        this.detectedBy = null
        this.detectedTime = null
    }
    async prepare() {
        const compressed_buffer = await compress_buffer(this.buffer)
        this.buffer = compressed_buffer
    }
    async save_to_debugDB() {
        await this.prepare()
        const {camera_ip, time_index, received, buffer, detections, detectedBy, detectedTime} = this
        db[camera_ip].run(
            `insert INTO snapshots(camera_ip, time_index, received, buffer, detections, detectedBy, detectedTime) VALUES (?,?,?,?,?,?,?)`,
            [camera_ip, time_index.toString(), received, buffer, JSON.stringify(detections), detectedBy, detectedTime],
            (err) => { if (err) console.log(err.message) }
        )
    }
}

module.exports = Snapshot