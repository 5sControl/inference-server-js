const {checkDirs} = require('./utils/Path')
// checkDirs([`debug/timeline`])
checkDirs([`images/timeline`])

const http = require('http')
const httpServer = http.createServer()
const { Server } = require("socket.io")
const ws = new Server(httpServer)

const Translation = require('./Translation')
const translation = new Translation(ws)
const report = require('./Report')

// var process = require('process')
// setInterval(() => {
//     console.log("📟 " + Math.floor(process.memoryUsage.rss()/1000000) + " MB")
// }, 1000)

ws.on("connection", (socket) => {

    const client = {
        id: socket.id,
        camera_ip: socket.request._query.camera_ip
    }
    socket.join(client.camera_ip)
    translation.addClient(client)

    socket.on("send report", async ({snapshots, extra}, response) => {
        try {
            if (snapshots.length !== 4) {                
                console.log("get snapshots from mcjs", snapshots, extra)
            }
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
        translation.removeClient(client.camera_ip)
        console.log(reason, socket.id)
        console.log(ws.of("/").adapter.rooms)
    })
});

const PORT = 9999
httpServer.listen(PORT, async () => {
    console.log(`listening on *:${PORT}`)
})