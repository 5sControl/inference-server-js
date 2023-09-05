const {createCanvas, Image} = require('@napi-rs/canvas')

class Drawer {
    constructor(buffer) {
        this.buffer = buffer
    }
    async draw_detections(snapshot, isDanger) {
        let promises = [this.draw_box(snapshot.zoneBbox, isDanger ? "red" : "green")]
        if (snapshot.detections.length > 0) {
            for (const person of snapshot.detections) {
                promises.push(this.draw_box(person.bbox, "blue"))
            }
        }
        await Promise.all(promises)
        return this.buffer
    }
    createCtx() {
        this.canvas = createCanvas(1920, 1080)
        this.ctx = this.canvas.getContext('2d')
        const image = new Image()
        image.src = this.buffer
        this.ctx.drawImage(image, 0, 0)
    }
    async draw_box(rect, color) {
        if (!this.ctx) this.createCtx()
        const [x, y, width, height] = rect
        this.ctx.lineWidth = 10
        this.ctx.strokeStyle = color
        this.ctx.beginPath()
        this.ctx.rect(x, y, width, height)
        this.ctx.stroke()
        this.buffer = await this.canvas.encode('jpeg', 50)
    }  
}

module.exports = Drawer