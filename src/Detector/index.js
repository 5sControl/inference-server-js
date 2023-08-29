const loadYoloNAS = require('./models/yolo-nas')
const {createCanvas, Image} = require("@napi-rs/canvas")

class Detector {
    model
    constructor() {
        if (!this.model) {
            console.time(`detector model load`)
            loadYoloNAS()
            .then(model => this.model = model)
            console.timeEnd(`detector model load`)
        }
    }
    async detect(buffer, bbox) {
        const croppedBuffer = await this.cutRegionFromBlob(buffer, bbox)
        console.time("detect")
        const detections = await this.model.detect(croppedBuffer, bbox)
        console.timeEnd("detect")
        return detections
    }
    async cutRegionFromBlob(buffer, bbox) {
        const [cHeight, cWidth] = [1080, 1920]
        let canvas = createCanvas(cWidth, cHeight)
        let ctx = canvas.getContext('2d')
        const image = new Image()
        image.src = buffer
        ctx.drawImage(image, 0, 0)
        const [x, y, width, height] = bbox
        const OFFSET = 20
        let cuttedWorker = ctx.getImageData(x - OFFSET, y - OFFSET, width + OFFSET, height + OFFSET)
        let newCan = createCanvas(width + OFFSET, height + OFFSET)
        let newCtx = newCan.getContext('2d')
        newCtx.putImageData(cuttedWorker, 0, 0)
        const croppedBlob = await newCan.encode('jpeg', 90)
        return croppedBlob
    }
    
}

const detector = new Detector()

module.exports = detector