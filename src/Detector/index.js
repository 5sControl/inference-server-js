const loadYoloV8 = require('./models/yolov8')

class Detector {

    model = {}

    async checkModel(model_weight) {
        if (!this.model[model_weight]) {
            console.time(`detector ${model_weight}-model load`)
            this.model[model_weight] = await loadYoloV8(model_weight)
            console.timeEnd(`detector ${model_weight}-model load`)
        }
    }
    async detect(model_weight, snapshot) {
        const start = Date.now()
        let detections = await this.model[model_weight].detect(snapshot.buffer)
        const finish = Date.now()
        const detected_time = finish - start
        console.log(model_weight + "-model detect: " + detected_time + " ms")
        snapshot.detections = detections
        snapshot.detected_time = detected_time
        return snapshot
    }
    
}

module.exports = Detector