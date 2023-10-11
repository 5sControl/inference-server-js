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
}

module.exports = Snapshot