import { parentPort, workerData } from 'worker_threads'
import loadYoloV8 from './models/yolov8.js'

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
if (!detector.model) await detector.init()

parentPort.on('message', async buffer => {
    
    const start = new Date()
    const detections = await detector.detect(buffer, "person")
    const end = new Date()

    const result = `${workerData}: ${end - start}`
    parentPort.postMessage({ result })
})

// module.exports = detector