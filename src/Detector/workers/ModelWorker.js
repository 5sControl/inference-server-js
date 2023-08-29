const workerpool = require('workerpool')

class ModelWorker {
    pool = null
    constructor(workerName) {
        this.pool = workerpool.pool(__dirname + `/${workerName}.js`)
    }
    async exec(buffer) {
        try {
            return await this.pool.exec('detect', [buffer])
        } catch (error) {
            console.error(error)
        }
    }
}

module.exports = ModelWorker