const loadYoloNAS = require('./models/yolo-nas')

class Detector {

    constructor() {
        if (!this.model) {
            console.time(`detector model load`)
            loadYoloNAS().then(model => this.model = model)
            console.timeEnd(`detector model load`)
        }
    }
    async detect(buffer) {
        console.time("detect")
        let detections = await this.model.detect(buffer)
        console.timeEnd("detect")
        return detections
    }
    
}

module.exports = Detector