const path = require('path')
const tf = require('@tensorflow/tfjs-node')
const labels = require("./labels")

const MODELS = {
    './yolov8s_web_model/model.json': labels,
    './yolov8m_web_model/model.json': labels
}

class YOLOv8 {

    constructor(model, labels, isInstanceSeqmentation) {
        this.model = {
            net: model,
            inputShape: model.inputs[0].shape
        }
        this.labels = labels
        this.numClass = labels.length
        this.isInstanceSeqmentation = isInstanceSeqmentation
    }

    /**
     * Preprocess image / frame before forwarded into the model
     * @param {Buffer} buffer
     * @param {Number} modelWidth
     * @param {Number} modelHeight
     * @returns input tensor, xRatio and yRatio
     */
    preProcess = (buffer, modelWidth, modelHeight) => {
        const input = tf.tidy(() => {
            const img = tf.node.decodeImage(buffer)
            // padding image to square => [n, m] to [n, n], n > m
            const [h, w] = img.shape.slice(0, 2) // get source width and height
            this.imageWidth = w
            const maxSize = Math.max(w, h) // get max size
            const imgPadded = img.pad([
                [0, maxSize - h], // padding y [bottom only]
                [0, maxSize - w], // padding x [right only]
                [0, 0]
            ])
            return tf.image
                .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
                .div(255.0) // normalize
                .expandDims(0) // add batch
        })
        return input
    }

    /**
     * Function run inference and do detection from source.
     * @param {Buffer} buffer
     * @returns input tensor, xRatio and yRatio
     */
    detect = async (buffer) => {
        // console.time("detect")

        const [modelWidth, modelHeight] = this.model.inputShape.slice(1, 3) // get model width and height

        tf.engine().startScope() // start scoping tf engine
        const input = this.preProcess(buffer, modelWidth, modelHeight) // preprocess image
        const output = this.model.net.execute(input) // inference model
        let result = this.isInstanceSeqmentation ? output[0] : output
        const transRes = result.transpose([0, 2, 1]) // transpose result [b, det, n] => [b, n, det]

        const boxes = tf.tidy(() => { // process boxes [y1, x1, y2, x2]
            const w = transRes.slice([0, 0, 2], [-1, -1, 1]) // get width
            const h = transRes.slice([0, 0, 3], [-1, -1, 1]) // get height
            const x1 = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2)) // x1
            const y1 = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2)) // y1
            return tf.concat([y1, x1, tf.add(y1, h), tf.add(x1, w)], 2).squeeze()
        })
        
        const [scores, classes] = tf.tidy(() => { // get max scores and classes index
            const rawScores = transRes.slice([0, 0, 4], [-1, -1, this.numClass]).squeeze() // class scores
            return [rawScores.max(1), rawScores.argMax(1)]
        })
    
        const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.45, 0.35) // NMS to filter boxes
        const boxes_data = boxes.gather(nms, 0).dataSync() // indexing boxes by nms index
        const scores_data = scores.gather(nms, 0).dataSync() // indexing scores by nms index
        const classes_data = classes.gather(nms, 0).dataSync() // indexing classes by nms index

        tf.dispose([output, transRes, boxes, scores, classes, nms]) // clear memory
        tf.engine().endScope() // end of scoping

        const detections = this.postProcess(boxes_data, scores_data, classes_data) // collect detections
        // console.timeEnd("detect")
        return detections

    }

    postProcess = (boxes_data, scores_data, classes_data) => {

        let detections = []
        for (let i = 0; i < scores_data.length; ++i) {
            
            // filter based on class threshold
            const klass = this.labels[classes_data[i]]
            const score = scores_data[i]
        
            let [y1, x1, y2, x2] = boxes_data.slice(i * 4, (i + 1) * 4)

            const ratio = this.imageWidth / this.model.inputShape[1]
            x1 *= ratio
            x2 *= ratio
            y1 *= ratio
            y2 *= ratio
            const width = x2 - x1
            const height = y2 - y1

            detections.push({
                x: x1,
                y: y1,
                width: width,
                height: height,
                score: score,
                classId: classes_data[i],
                class: klass,
                bbox: [x1, y1, width, height]
            })
        }
        return detections
    }

}

async function loadYoloV8(modelUrl, isInstanceSeqmentation = false) {
    const model = await tf.loadGraphModel(`file://${path.join(__dirname, modelUrl)}`)
    // warming up model
    const dummyInput = tf.ones(model.inputs[0].shape)
    const warmupResults = model.execute(dummyInput)
    tf.dispose([warmupResults, dummyInput]) // cleanup memory    
    return new YOLOv8(model, MODELS[modelUrl], isInstanceSeqmentation)
}

module.exports = loadYoloV8