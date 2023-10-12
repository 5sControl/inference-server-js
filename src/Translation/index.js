const onvifSocketURL = process.env.socket_server || `http://${process.env.server_url}:3456`
const socketClient = require("socket.io-client")(onvifSocketURL)
const Snapshot = require("./Snapshot.js")
const {checkDirs} = require("../utils/Path")
const Detector = require("../Detector")
const detector = new Detector()
const hardCameras = ["0.0.0.0", "10.20.100.40", "10.20.100.43"]
// const { is_working_time } = require("../utils/Date")
// const {db} = require("../debugDB")

class Translation {

    constructor(ws) {
        this.ws = ws
        socketClient.on("connect", async () => {
            console.log(`Connected to the onvif socket server: ${onvifSocketURL}`)
        })
        socketClient.on("snapshot_updated", ({ camera_ip, screenshot }) => {
            const received = new Date()
            if (this.isCameraProcessed(camera_ip)) {
                this.update(screenshot, camera_ip, received)
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
        return buffer
    }
    async update(receivedBuffer, camera_ip, received) {
        try {
            const checkedBuffer = this.check(receivedBuffer)
            if (checkedBuffer) {
                this.buffer.saveLastLength()
                this.buffer.current = checkedBuffer
                if (this.cameras[camera_ip].model_weight === "l") {                    
                    this.cameras[camera_ip].isDetect = this.cameras[camera_ip].isDetect ? false : true
                    if (!this.cameras[camera_ip].isDetect) return
                }
                let snapshot = new Snapshot(checkedBuffer, received)
                const start = Date.now()
                const detections = await detector.detect(this.cameras[camera_ip].model_weight, snapshot.buffer)
                const finish = Date.now()
                const detected_time = finish - start
                console.log(this.cameras[camera_ip].model_weight + "-model detect: " + detected_time + " ms")
                snapshot.detections = detections
                snapshot.detected_time = detected_time
                this.distribute(camera_ip, snapshot)
                // if (is_working_time() && global.recordedCameras.includes(camera_ip)) db.save_to_debugDB(snapshot, camera_ip)
            }
        } catch (error) {
            console.log("translation update error", error)
        }
    }
}

module.exports = Translation