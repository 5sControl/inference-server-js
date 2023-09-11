const { Worker } = require('worker_threads')

class CameraDetector {
    constructor(camera_ip) {
        this.worker = new Worker(__dirname + `/worker.mjs`, {
            workerData: {camera_ip}
        })
    }
    async detect(buffer) {
        this.worker.postMessage(buffer)
        const detections = await new Promise(resolve => this.worker.once('message', message => resolve(message)))
        return detections
    }
    
}

module.exports = CameraDetector