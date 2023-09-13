const onvifSocketURL = `${process.env.server_url}:3456` || process.env.socket_server
const socketClient = require('socket.io-client')(onvifSocketURL)
const Snapshot = require('./Snapshot.js')
const CameraDetector = require("../Detector/CameraDetector.js")

class Translation {

    constructor(ws) {
        this.ws = ws
        socketClient.on("connect", async () => {
            console.log(`Connected to the onvif socket server: ${onvifSocketURL}`)
        })
        socketClient.on("snapshot_updated", ({ camera_ip, screenshot }) => {
            console.log("snapshot_updated", camera_ip)
            if (this.isCameraProcessed(camera_ip)) {
                this.update(screenshot, camera_ip)
            }
        })
    }

    cameras = {}
    addClient(client) {
        if (this.isCameraProcessed(client.camera_ip)) {
            console.log("camera is already being processed")
        } else {
            console.log("there is no such camera, add it")
            this.cameras[client.camera_ip] = {
                index: 0,
                worker: new CameraDetector(client.camera_ip)
            }
        }
        console.log('new algorithm subscribed: ', client)
        console.log(this.cameras)
    }
    isCameraProcessed(camera_ip) {
        return this.cameras[camera_ip] !== undefined
    }
    distribute(snapshot) {
        this.ws.to(snapshot.camera_ip).emit("snapshot detected", snapshot)
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
    async update(receivedBuffer, camera_ip) {
        console.log("start update", camera_ip)
        try {
            const checkedBuffer = this.check(receivedBuffer)
            if (checkedBuffer) {
                this.buffer.saveLastLength()
                this.buffer.current = checkedBuffer
                this.cameras[camera_ip].index++
                let snapshot = new Snapshot(camera_ip, this.cameras[camera_ip].index, checkedBuffer)
                const detections = await this.cameras[camera_ip].worker.detect(snapshot.buffer)
                snapshot.detections = detections
                this.distribute(snapshot)
            }
        } catch (error) {
            console.log("translation update error", error)
        }
    }
}

module.exports = Translation