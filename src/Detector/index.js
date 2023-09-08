const loadYoloV8 = require('./models/yolov8')

class Detector {
    async init() {
        if (!this.model) {
            console.time(`detector models load`)
            this.model = await loadYoloV8(`./yolov8s_web_model/model.json`)
            console.timeEnd(`detector models load`)
        }
    }
    async detect(buffer, filterLabel) {
        let detections = await this.model.detect(buffer)
        return detections.filter(d => d.class === filterLabel)
    }
}

const detector = new Detector()
module.exports = detector