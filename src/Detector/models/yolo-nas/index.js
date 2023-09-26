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
    
    scoreThreshold = 0.3
    iouThreshold = 0.45
    topk = 100
    
    constructor(model_type) {
        this.model_type = model_type
    }
    async init() {
        const shape = +this.model_type.substring(2)
        this.inputShape = [1, 3, shape, shape]
        this.session = await ort.InferenceSession.create(path.join(__dirname, `yolo_nas_${this.model_type}.onnx`))
        this.arrBufNMS = await ort.InferenceSession.create(path.join(__dirname, "nms-yolo-nas.onnx"))
        this.labels = JSON.parse(fs.readFileSync(path.join(__dirname, "labels.json")))
        // warmup main model
        const tensor = new ort.Tensor("float32", new Float32Array(this.inputShape.reduce((a, b) => a * b)), this.inputShape)
        await this.session.run({ "input.1": tensor })
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

    async detect(buffer, img_bbox) {
    
        // Buffer -> Tensor
        const imageData = await this.getImageData(buffer, this.inputShape[2], this.inputShape[3])
        const preprocessedData = this.preprocess(imageData.data, this.inputShape[2], this.inputShape[3])
        const tensor = new ort.Tensor("float32", preprocessedData, this.inputShape)
    
        const output = await this.session.run({ "input.1": tensor })
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

        return this.postProcess(selected, img_bbox)
    }

    postProcess(selected, img_bbox) {
        const detections = []
        for (let idx = 0; idx < selected.dims[1]; idx++) {
            const data = selected.data.slice(idx * selected.dims[2], (idx + 1) * selected.dims[2])
            const box = data.slice(0, 4)
            const scores = data.slice(4)
            for (let i = 0; i < scores.length; ++i) {
                const score = Math.max(...scores)
                const label = scores.indexOf(score)
                let [x1, y1, x2, y2] = box.slice(i * 4, (i + 1) * 4)
                const ratioX = img_bbox[2] / this.inputShape[2]
                const ratioY = img_bbox[3] / this.inputShape[3]
                x1 *= ratioX
                x2 *= ratioX
                y1 *= ratioY
                y2 *= ratioY
                const width = x2 - x1
                const height = y2 - y1
                if (score > this.scoreThreshold) {
                    detections.push({
                        x: y1,
                        y: x1,
                        width: width,
                        height: height,
                        score: score,
                        classId: label,
                        class: this.labels[label],
                        bbox: [x1 + img_bbox[0], y1 + img_bbox[1], width, height]
                    })
                    break
                }
            }
        }
        return detections
    }

}

async function loadYoloNAS(model_type) {
    const model = new YOLO_NAS(model_type)
    await model.init()
    return model
}

module.exports = loadYoloNAS