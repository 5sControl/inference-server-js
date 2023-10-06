const loadYoloNAS = require("./models/yolo-nas")

class Detector {

    model = {}

    async checkModel(model_weight) {
        if (!this.model[model_weight]) {
            console.time(`detector ${model_weight}-model load`)
            this.model[model_weight] = await loadYoloNAS(model_weight)
            console.timeEnd(`detector ${model_weight}-model load`)
        }
    }
    async detect(model_weight, buffer) {
        let detections = await this.model[model_weight].detect(buffer)
        return detections
    }
    
}

module.exports = Detector