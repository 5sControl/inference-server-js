const fs = require('fs')
const path = require("path")

const ort = require('onnxruntime-node')
const { loadImage, createCanvas  } = require("@napi-rs/canvas")
const ndarray = require("ndarray")
const ops = require("ndarray-ops")

class YOLO_NAS {

    session
    arrBufNMS
    labels
    
    inputShape = [1, 3, 640, 640]
    scoreThreshold = 0.5
    iouThreshold = 0.2
    topk = 100
    
    constructor() {}
    async init() {
        this.session = await ort.InferenceSession.create(path.join(__dirname, "yolo_nas_s.onnx"))
        this.arrBufNMS = await ort.InferenceSession.create(path.join(__dirname, "nms-yolo-nas.onnx"))
        this.labels = JSON.parse(fs.readFileSync(path.join(__dirname, "labels.json")))
        // warmup main model
        const tensor = new ort.Tensor("float32", new Float32Array(this.inputShape.reduce((a, b) => a * b)), this.inputShape)
        await this.session.run({ images: tensor })
    }

    preprocess(data, width, height) {
        const dataFloat = new Float32Array(data)
        const dataFromImage = ndarray(dataFloat, [width, height, 4])
        const dataProcessed = ndarray(new Float32Array(width * height * 3), [1, 3, height, width])
        ops.divseq(dataFromImage, 255) // Normalize 0-255 to [0, 1]
        // Realign imageData from [224*224*4] to the correct dimension [1*3*224*224]
        ops.assign(dataProcessed.pick(0, 0, null, null), dataFromImage.pick(null, null, 0))
        ops.assign(dataProcessed.pick(0, 1, null, null), dataFromImage.pick(null, null, 1))
        ops.assign(dataProcessed.pick(0, 2, null, null), dataFromImage.pick(null, null, 2))
        return dataProcessed.data        
    }

    async getImageData(buffer, modelWidth, modelHeight) {
        const canvas = createCanvas(modelWidth, modelHeight)
        const ctx = canvas.getContext('2d')
        const image = await loadImage(buffer)
        ctx.drawImage(image, 0, 0, modelWidth, modelHeight)
        const imageData = ctx.getImageData(0, 0, modelWidth, modelHeight)
        return imageData
    }

    async detect(buffer, bbox) {

        // Buffer -> Tensor
        this.bufferX = bbox[0]
        this.bufferY = bbox[1]
        this.bufferWidth = bbox[2]
        this.bufferHeight = bbox[3]
        const imageData = await this.getImageData(buffer, this.inputShape[2], this.inputShape[3])
        const preprocessedData = this.preprocess(imageData.data, this.inputShape[2], this.inputShape[3])
        const tensor = new ort.Tensor("float32", preprocessedData, this.inputShape)
    
        const output = await this.session.run({ images: tensor })
        const outNames = this.session.outputNames
        const config = new ort.Tensor("float32",
            new Float32Array([
                this.topk,
                this.iouThreshold,
                this.scoreThreshold,
            ])
        )
        
        const { selected } = await this.arrBufNMS.run({
            bboxes: output[outNames[0]],
            scores: output[outNames[1]],
            config,
        })

        return this.postProcess(selected)
    }

    postProcess(selected) {
        const detections = []
        for (let idx = 0; idx < selected.dims[1]; idx++) {
            const data = selected.data.slice(idx * selected.dims[2], (idx + 1) * selected.dims[2])
            const box = data.slice(0, 4)
            const scores = data.slice(4)
            for (let i = 0; i < scores.length; ++i) {
                const score = Math.max(...scores)
                const label = scores.indexOf(score)
                let [y1, x1, y2, x2] = box.slice(i * 4, (i + 1) * 4)
                const ratioX = this.bufferHeight / 640
                const ratioY = this.bufferWidth / 640
                x1 *= ratioX
                x2 *= ratioX
                y1 *= ratioY
                y2 *= ratioY
                const width = y2 - y1
                const height = x2 - x1
                if (score > this.scoreThreshold) {
                    detections.push({
                        x: y1,
                        y: x1,
                        width: width,
                        height: height,
                        score: score,
                        classId: label,
                        class: this.labels[label],
                        bbox: [y1 + this.bufferX, x1 + this.bufferY, width, height]
                    })
                    break
                }
            }
        }
        return detections
    }

}

async function loadYoloNAS() {
    const model = new YOLO_NAS()
    await model.init()
    return model
}

module.exports = loadYoloNAS