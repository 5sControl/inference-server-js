const compress_buffer = require("./compress_buffer")
// const db = require("../debugDB")

class Snapshot {
    constructor(camera_ip, time_index, buffer) {
        this.camera_ip = camera_ip
        this.time_index = time_index
        this.buffer = buffer
        this.received = new Date()
        this.detections = []
    }
    async prepare() {
        const compressed_buffer = await compress_buffer(this.buffer)
        this.buffer = compressed_buffer
    }
    async save_to_debugDB() {
        await this.prepare()
        const {camera_ip, time_index, buffer, detections} = this
        db.run(
            `insert INTO snapshots(camera_ip, time_index, buffer, detections) VALUES (?,?,?,?)`,
            [camera_ip, time_index.toString(), buffer, JSON.stringify(detections)],
            (err) => { if (err) console.log(err.message) }
        )    
    }
}

module.exports = Snapshot