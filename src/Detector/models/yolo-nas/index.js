const path = require("path")

const ort = require("onnxruntime-node")
const { cv } = require('opencv-wasm')
const {Canvas, createCanvas, Image} = require('canvas')
const Configs = require("./utils/configs")
const { PreProcessing, PostProcessing } = require("./utils/processing")

class YOLO_NAS {
    
    constructor() {}
    async init(model_type) {
        console.time("model init")
        global.HTMLCanvasElement = Canvas
        global.HTMLImageElement = Image
        
        const shape = +model_type.substring(2)
        this.configs = new Configs([1, 3, shape, shape], 0.3, 0.45, 100)

        await this.configs.init()
        const prep = new PreProcessing(this.configs.prepSteps, [
            this.configs.inputShape[3],
            this.configs.inputShape[2],
        ]);
        const postp = new PostProcessing(
            this.configs.prepSteps,
            this.configs.iouThresh,
            this.configs.scoreThresh,
            this.configs.topk,
            this.configs.labels
        )

        const yoloNAS = await ort.InferenceSession.create(path.join(__dirname,  `weights/yolo_nas_${model_type}.onnx`))
        const nms = await ort.InferenceSession.create(path.join(__dirname, "nms-yolo-nas.onnx"))

        const tensor = new ort.Tensor(
            "float32",
            new Float32Array(this.configs.inputShape.reduce((a, b) => a * b)),
            this.configs.inputShape
        )
        await yoloNAS.run({ "input.1": tensor })
      
        this.session = { net: yoloNAS, inputShape: this.configs.inputShape, nms: nms }
        this.processing = { preProcessing: prep, postProcessing: postp }
        
        console.timeEnd("model init")

    }

    async detect(buffer, zone) {
    
        const canvas = createCanvas(640, 360)
        const ctx = canvas.getContext('2d')
        const image = new Image()
        image.src = buffer
        ctx.drawImage(image, 0, 0, image.width/3, image.height/3)
    
        const img = cv.imread(canvas)
        const prep = new PreProcessing(this.configs.prepSteps, [
            this.configs.inputShape[3],
            this.configs.inputShape[2],
        ]);

        const [input, metadata] = prep.run(img)
    
        const tensor = new ort.Tensor("float32", input.data32F, this.session.inputShape)

        const postp = new PostProcessing(
            this.configs.prepSteps,
            this.configs.iouThresh,
            this.configs.scoreThresh,
            this.configs.topk,
            this.configs.labels
        )

        const config = new ort.Tensor("float32",
          new Float32Array([
            postp.topk,
            postp.iouThresh,
            postp.scoreThresh,
          ])
        )
        const outNames = this.session.net.outputNames
    
        const output = await this.session.net.run({ "input.1": tensor })
        const { selected } = await this.session.nms.run({
            bboxes: output[outNames[0]],
            scores: output[outNames[1]],
            config: config,
        })

        const boxes = []
        for (let idx = 0; idx < selected.dims[1]; idx++) {
            const data = selected.data.slice(idx * selected.dims[2], (idx + 1) * selected.dims[2])
            const [box, score, label] = postp.run(data, [...metadata])
            let new_box = []
            for (const n of box) new_box.push(n*3)
            boxes.push({
                label,
                score,
                bbox: new_box,
            })
        }

        input.delete()
        img.delete()

        const filtered_boxes = boxes.filter(b => b.label === 0)

        let detections = []
        for (const {score, bbox} of filtered_boxes) {
            const [x, y, width, height] = bbox
            const new_bbox = [x + zone[0], y + zone[1], width, height]
            detections.push({
                x: new_bbox[0],
                y: new_bbox[1],
                width: new_bbox[2],
                height: new_bbox[3],
                score,
                class: "person",
                bbox: new_bbox
            })
        }
        return detections
    }

}

async function loadYoloNAS(model_type) {
    const model = new YOLO_NAS()
    await model.init(model_type)
    return model
}

module.exports = loadYoloNAS