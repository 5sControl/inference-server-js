class Snapshot {
    constructor(camera_ip, index, buffer) {
        this.camera_ip = camera_ip
        this.index = index
        this.buffer = buffer
        this.received = new Date()
        this.detections = []
    }
    // prepare_for(sending | db)
        // 1. remove buffer, camera_ip and received
        // 2. compress buffer
}

module.exports = Snapshot