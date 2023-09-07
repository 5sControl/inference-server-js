const http = require('http')
const httpServer = http.createServer()
const { Server } = require("socket.io")
const ws = new Server(httpServer)

const detector = require('./Detector')
const Translation = require('./Translation')
const translation = new Translation(ws, detector)
const report = require('./Report')


ws.on("connection", (socket) => {

    const client = {
        id: socket.id,
        camera_ip: socket.request._query.camera_ip
    }
    socket.join(client.camera_ip)
    translation.addClient(client)

    socket.on("send report", async ({snapshots, extra}, response) => {
        try {
            await report.prepare(
                snapshots,
                extra,
                client.camera_ip
            )
            response({ status: "inference server: report sended" })
        } catch (error) {
            console.log(error)
            response({ status: error })
        }
    })
    socket.on("disconnect", (reason) => {
        translation.removeSubscriber(client.camera_ip)
        console.log(reason, socket.id)
        console.log(ws.of("/").adapter.rooms)
        console.log(ws.of("/").adapter.rooms.get(client.camera_ip))
    })
});

const PORT = 9999
httpServer.listen(PORT, async () => {
    await detector.init()
    console.log(`listening on *:${PORT}`)
})