const onvifSocketURL = process.env.socket_server || `http://${process.env.server_url}:3456`
const socketClient = require('socket.io-client')(onvifSocketURL)
const Snapshot = require('./Snapshot.js')
const { create_time_index } = require("../utils/Date")
const {checkDirs} = require('../utils/Path')
const Detector = require("../Detector")
const detector = new Detector()
detector.init()

const fs = require("fs")
const {createCanvas, Image} = require('@napi-rs/canvas')


class Translation {

    constructor(ws) {
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
            let is_valid_zones = true
            for (const zone of client.zones) {
                const [x,y, width, height] = zone
                if (width > 640 && height > 640) {
                    is_valid_zones = false
                }
            }
            if (is_valid_zones) {
                this.cameras[client.camera_ip].zones = client.zones
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
        try {
            const checkedBuffer = this.check(receivedBuffer)
            if (checkedBuffer) {
                this.buffer.saveLastLength()
                this.buffer.current = checkedBuffer
                this.cameras[camera_ip].index++
                let snapshot = new Snapshot(camera_ip, this.cameras[camera_ip].index, checkedBuffer)

                let detections = []

                if (this.cameras[camera_ip].zones) {
                    let promises = []
                    for (const zone of this.cameras[camera_ip].zones) {
                        promises.push(detector.detect(snapshot.buffer, "person", zone))
                    }
                    const result = await Promise.all(promises)
                    detections = result.flat()
                } else {
                    const result = await detector.detect(snapshot.buffer, "person")
                    detections = result
                }

                snapshot.detections = detections

                snapshot.detectedBy = this.cameras[camera_ip].zones ? "s" : "m"
                // snapshot.detectedBy = "m"

                // const canvas2 = createCanvas(1920, 1080)
                // const ctx2 = canvas2.getContext('2d')
                // const image2 = new Image()
                // image2.src = snapshot.buffer
                // ctx2.drawImage(image2, 0, 0, image2.width, image2.height)
                // for (const detection of snapshot.detections) {

                //     const color = "blue";
                //     const score = (detection.score * 100).toFixed(1);
                //     const [x, y, width, height] = detection.bbox;

                //     ctx2.strokeStyle = color;
                //     // ctx2.lineWidth = Math.max(Math.min(640, 360) / 200, 2.5);
                //     ctx2.strokeRect(x, y, width, height);
          
                //     ctx2.font = "bold 24px sans"
                //     ctx2.fillStyle = "blue"
                //     ctx2.fillText(`${Math.floor(score)}`, x, y)
          
                // }
                
                // const drawed_buffer = await canvas2.encode('jpeg', 50)
                // fs.writeFileSync(`timeline/${+snapshot.received}.jpeg`, drawed_buffer)
            

                this.distribute(snapshot)
                if (process.env.is_test) snapshot.save_to_debugDB()
            }
        } catch (error) {
            console.log("translation update error", error)
        }
    }
}

module.exports = Translation