const onvifSocketURL = process.env.socket_server || `http://${process.env.server_url}:3456`
const socketClient = require('socket.io-client')(onvifSocketURL)
const Snapshot = require('./Snapshot.js')
const { create_time_index } = require("../utils/Date")
const {checkDirs} = require('../utils/Path')
const Detector = require("../Detector")
const detector = new Detector()


const fs = require("fs")
const {createCanvas, Image} = require('canvas')

class Translation {

    constructor(ws) {
        this.timeline_index = 1
        this.ws = ws
        socketClient.on("connect", async () => {
            console.log(`Connected to the onvif socket server: ${onvifSocketURL}`)
        })
        socketClient.on("snapshot_updated", ({ camera_ip, screenshot }) => {
            if (this.isCameraProcessed(camera_ip)) {
                this.update(screenshot, camera_ip)
            }
        })
    }

    cameras = {}
    // cameras = {"0.0.0.0": {index: create_time_index()}}
    addClient(client) {
        if (this.isCameraProcessed(client.camera_ip)) {
            console.log("camera is already being processed")
        } else {
            console.log("there is no such camera, add it")
            this.cameras[client.camera_ip] = {
                index: create_time_index()
            }
            checkDirs([`images/${client.camera_ip}`])
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
        try {
            const checkedBuffer = this.check(receivedBuffer)
            if (checkedBuffer) {
                this.buffer.saveLastLength()
                this.buffer.current = checkedBuffer
                this.cameras[camera_ip].index++
                let snapshot = new Snapshot(camera_ip, this.cameras[camera_ip].index, checkedBuffer)
                const detections = await detector.detect(snapshot.buffer)
                snapshot.detections = detections
                snapshot.detectedBy = "nas"

                if (["0.0.0.0", "10.20.100.40"].includes(camera_ip)) {
                    const canvas2 = createCanvas(1920, 1080)
                    const ctx2 = canvas2.getContext('2d')
                    const image2 = new Image()
                    image2.src = snapshot.buffer
                    ctx2.drawImage(image2, 0, 0, image2.width, image2.height)
                    ctx2.lineWidth = 10
                    for (const detection of snapshot.detections) {
                        const color = "yellow";
                        const score = (detection.score * 100).toFixed(1);
                        const [x, y, width, height] = detection.bbox
                        ctx2.strokeStyle = color
                        ctx2.strokeRect(x, y, width, height)
                        ctx2.fillStyle = "blue"
                        ctx2.fillRect(x + 5, y - 30, 40, 30)
                        ctx2.fillStyle = "yellow"
                        ctx2.font = "bold 30px sans"
                        ctx2.fillText(`${Math.floor(score)}`, x + 7, y - 5)
                    }
                    const drawed_buffer = canvas2.toBuffer('image/jpeg', { quality: 0.5 })
                    fs.writeFileSync(`debug/timeline/${this.timeline_index}.jpeg`, drawed_buffer)
                    this.timeline_index = this.timeline_index > 1000 ? 1 : this.timeline_index + 1
                }

                this.distribute(snapshot)
                if (process.env.is_test) snapshot.save_to_debugDB()
            }
        } catch (error) {
            console.log("translation update error", error)
        }
    }
}

module.exports = Translation