const path = require("path")

const ort = require("onnxruntime-node")
const { cv } = require('opencv-wasm')
const {Canvas, createCanvas, Image} = require('canvas')
const Configs = require("./utils/configs")
const { PreProcessing, PostProcessing } = require("./utils/processing")
const configs = new Configs([1, 3, 640, 640], 0.3, 0.45, 100)

class YOLO_NAS {
    
    constructor() {}
    async init() {

        console.time("detector init")
        global.HTMLCanvasElement = Canvas
        global.HTMLImageElement = Image
        
        await configs.init()
        const prep = new PreProcessing(configs.prepSteps, [
            configs.inputShape[3],
            configs.inputShape[2],
        ]);
        const postp = new PostProcessing(
            configs.prepSteps,
            configs.iouThresh,
            configs.scoreThresh,
            configs.topk,
            configs.labels
        )

        const yoloNAS = await ort.InferenceSession.create(path.join(__dirname, "weights/yolo_nas_l.onnx"))
        const nms = await ort.InferenceSession.create(path.join(__dirname, "nms-yolo-nas.onnx"))
    
        const tensor = new ort.Tensor(
            "float32",
            new Float32Array(configs.inputShape.reduce((a, b) => a * b)),
            configs.inputShape
        )
        await yoloNAS.run({ "input.1": tensor })
      
        this.session = { net: yoloNAS, inputShape: configs.inputShape, nms: nms }
        this.processing = { preProcessing: prep, postProcessing: postp }
        
        console.timeEnd("detector init")

    }

    async detect(buffer) {
    
        const canvas = createCanvas(960, 590)
        const ctx = canvas.getContext('2d')
        const image = new Image()
        image.src = buffer
        ctx.drawImage(image, 0, 0, image.width/2, image.height/2)
    
        const img = cv.imread(canvas)
        const prep = new PreProcessing(configs.prepSteps, [
            configs.inputShape[3],
            configs.inputShape[2],
        ]);

        const [input, metadata] = prep.run(img)
    
        const tensor = new ort.Tensor("float32", input.data32F, this.session.inputShape)

        const postp = new PostProcessing(
            configs.prepSteps,
            configs.iouThresh,
            configs.scoreThresh,
            configs.topk,
            configs.labels
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
            for (const n of box) new_box.push(n*2)
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
            detections.push({
                x: bbox[0],
                y: bbox[1],
                width: bbox[2],
                height: bbox[3],
                score,
                class: "person",
                bbox
            })
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