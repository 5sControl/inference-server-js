const {createCanvas, Image} = require('@napi-rs/canvas')
const loadYoloV8 = require('./models/yolov8')
// const fs = require("fs")

class Detector {
    async init() {
        if (!this.model) {
            console.time(`detector models load`)
            this.model = {
                n: await loadYoloV8(`./yolov8s-320_web_model/model.json`),
                m: await loadYoloV8(`./yolov8m_web_model/model.json`)
            }
            console.timeEnd(`detector models load`)
        }
    }
    async detect(buffer, filterLabel, zone) {
        let detections = []
        if (zone) {
            const cutted_buffer = await this.cutRegionFromBlob(buffer, zone)
            detections = await this.model.n.detect(cutted_buffer, zone)

            // detections = await this.model.n.detect(cutted_buffer)
            // detections = detections.filter(d => d.class === filterLabel)

            // const canvas2 = createCanvas(zone[2], zone[3])
            // const ctx2 = canvas2.getContext('2d')
            // const image2 = new Image()
            // image2.src = cutted_buffer
            // ctx2.drawImage(image2, 0, 0, image2.width, image2.height)
            // for (const detection of detections) {

            //     const color = "blue";
            //     const score = (detection.score * 100).toFixed(1);
            //     const [x, y, width, height] = detection.bbox;

            //     ctx2.strokeStyle = color;
            //     // ctx2.lineWidth = Math.max(Math.min(640, 360) / 200, 2.5);
            //     ctx2.strokeRect(x, y, width, height);
      
            //     ctx2.font = "bold 24px sans"
            //     ctx2.fillStyle = "blue"
            //     ctx2.fillText(`${Math.floor(score)}`, x, y)
      
            // }            
            // const drawed_buffer = await canvas2.encode('jpeg', 50)
            // fs.writeFileSync(`crop/${+new Date()}.jpeg`, drawed_buffer)

        } else {
            detections = await this.model.m.detect(buffer)
        }
        return detections.filter(d => d.class === filterLabel)
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

module.exports = Detector