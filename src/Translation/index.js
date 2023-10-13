const onvifSocketURL = process.env.socket_server || `http://${process.env.server_url}:3456`
const socketClient = require("socket.io-client")(onvifSocketURL)
const Snapshot = require("./Snapshot.js")
const {checkDirs} = require("../utils/Path")
const Detector = require("../Detector")
const detector = new Detector()
const hardCameras = ["0.0.0.0", "10.20.100.40", "10.20.100.43"]
// const {save_camera_info, save_snapshot, save_screenshot} = require("../debugDB")
// const { is_working_time } = require("../utils/Date")

class Translation {

    detector_queue = []
    is_detector_sleep = true

    constructor(ws) {
        this.ws = ws
        socketClient.on("connect", async () => {
            console.log(`Connected to the onvif socket server: ${onvifSocketURL}`)
        })
        socketClient.on("snapshot_updated", ({ camera_ip, screenshot }) => {
            const received = new Date()
            if (this.isCameraProcessed(camera_ip)) {
                // 1. save_screenshot(camera_ip, received, screenshot)
                // if (is_working_time() && global.recordedCameras.includes(camera_ip)) save_screenshot(camera_ip, received, screenshot)
                let snapshot = this.update(camera_ip, received, screenshot)
                if (snapshot) {
                    // 2. add_to_detector_queue
                    this.detector_queue.push({snapshot, model_weight: this.cameras[camera_ip].model_weight, camera_ip})
                    // 3. check detector cycle
                    if (this.is_detector_sleep) { 
                        this.is_detector_sleep = false
                        this.detect_cycle()
                    }
                }
            }
        })
    }

    cameras = {}
    async addClient(client) {
        if (this.isCameraProcessed(client.camera_ip)) {
            console.log("camera is already being processed")
        } else {
            console.log("there is no such camera, add it")
            this.cameras[client.camera_ip] = {
                isDetect: true
            }
            checkDirs([`images/${client.camera_ip}`])
            let model_weight = hardCameras.includes(client.camera_ip) ? "l" : "s"
            this.cameras[client.camera_ip].model_weight = model_weight
            // const camera_info = {
            //     detected_by: model_weight,
            //     zones: client.zones
            // }
            // save_camera_info(client.camera_ip, camera_info)
            await detector.checkModel(model_weight)
        }
        console.log("new algorithm subscribed: ", client)
        console.log(this.cameras)
    }
    isCameraProcessed(camera_ip) {
        return this.cameras[camera_ip] !== undefined
    }
    distribute(camera_ip, snapshot) {
        this.ws.to(camera_ip).emit("snapshot detected", snapshot)
    }
    removeClient(camera_ip) {
        if (!this.ws.of("/").adapter.rooms.get(camera_ip)) {
            delete this.cameras[camera_ip]
        }
        console.log("algorithm removed from subscribers")
    }

    buffer = {
        current: null,
        previous: {
            length: 0
        },
        saveLastLength() {
            this.previous.length = this.current?.length
        }
    }
    check(buffer) {
        if (buffer === null) {
            console.log("translation get null buffer")
            return null
        }
        if (buffer.length < 30000) {
            console.log("translation get broken buffer", `buffer length is ${buffer.length} \n`)
            return null
        }
        if (buffer.length === this.buffer.current?.length) {
            console.log("translation get same buffer")
            return null
        }
        this.buffer.saveLastLength()
        this.buffer.current = buffer
        return buffer
    }
    update(camera_ip, received, receivedBuffer) {
        try {
            const checkedBuffer = this.check(receivedBuffer)
            if (checkedBuffer) {
                // if (this.cameras[camera_ip].model_weight === "l") {                    
                //     this.cameras[camera_ip].isDetect = this.cameras[camera_ip].isDetect ? false : true
                //     if (!this.cameras[camera_ip].isDetect) return null
                // }
                return new Snapshot(checkedBuffer, received)
            }
        } catch (error) {
            console.log("translation update error", error)
        }
    }
    async detect_cycle() {
        const {snapshot, model_weight, camera_ip} = this.detector_queue[0]
        const detected_snapshot = await detector.detect(model_weight, snapshot)
        this.distribute(camera_ip, detected_snapshot)
        // if (is_working_time() && global.recordedCameras.includes(camera_ip)) save_snapshot(detected_snapshot, camera_ip)
        this.detector_queue.shift()
        this.detector_queue[0] ? this.detect_cycle() : this.is_detector_sleep = true
    }
}

module.exports = Translation