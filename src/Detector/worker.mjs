import { parentPort, workerData } from 'worker_threads'
import Detector from "./index.js"

const detector = new Detector()
if (!detector.model) await detector.init()

parentPort.on('message', async (buffer) => {
    const start = new Date()
    const detections = await detector.detect(buffer, "person")
    const end = new Date()
    const time = `⏱️  ${workerData.camera_ip}: ${end - start}ms`
    console.log(time)
    parentPort.postMessage(detections)
})