const workerpool = require('workerpool')

class ModelWorker {
    pool = null
    constructor(workerName) {
        this.pool = workerpool.pool(__dirname + `/${workerName}.js`)
    }
    async exec(buffer, zone) {
        try {
            const detections = await this.pool.exec('detect', [buffer, zone])
            return detections
        } catch (error) {
            console.error(error)
        }
    }
}

module.exports = ModelWorker