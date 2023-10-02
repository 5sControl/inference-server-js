const loadYoloNAS = require('./models/yolo-nas')
const {createCanvas, Image} = require('canvas')

class Detector {

    async init() {
        if (!this.model) {
            console.time(`detector init`)
            this.model = {
                light: await loadYoloNAS("s_320"),
                hard: await loadYoloNAS("l_416")
            }
            console.timeEnd(`detector init`)
        }
    }
    async detect(buffer, img_bbox, weights) {
        const cutted_buffer = await this.cutRegionFromBlob(buffer, img_bbox)
        let detections = await this.model[weights].detect(cutted_buffer, img_bbox)
        return detections
    }
    async cutRegionFromBlob(buffer, bbox) {
        let canvas = createCanvas(1920, 1080)
        let ctx = canvas.getContext('2d')
        const image = new Image()
        image.src = buffer
        ctx.drawImage(image, 0, 0)
        const [x, y, width, height] = bbox
        let imageData = ctx.getImageData(x, y, width, height)
        let newCanvas = createCanvas(width, height)
        let newCtx = newCanvas.getContext('2d')
        newCtx.putImageData(imageData, 0, 0)
        const cuttedBlob = newCanvas.toBuffer('image/jpeg', { quality: 0.9 })
        return cuttedBlob
    }
}

module.exports = Detector