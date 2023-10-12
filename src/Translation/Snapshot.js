class Snapshot {
    constructor(buffer, received) {
        this.received = received
        this.buffer = buffer
        this.detections = []
        this.detected_time = null
    }
}

module.exports = Snapshot