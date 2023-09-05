const {createCanvas, Image} = require('@napi-rs/canvas')

class Drawer {
    constructor(buffer, eventName = "") {
        this.buffer = buffer
        this.eventName = eventName
    }
    async draw(window) {
        let promises = [this.drawEvent(this.eventName)]
        if (window) promises.push(this.drawCornersState(window))
        await Promise.all(promises)
        return this.buffer
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
        // this.ctx.fillStyle = "white"
        // this.ctx.font = "48px serif"
        // this.ctx.fillText(`${Math.floor(score * 100)}`, x, y)
        this.buffer = await this.canvas.encode('jpeg', 50)
    }
    async drawEvent(text) {
        if (!this.ctx) this.createCtx()
        this.ctx.font = "bold 36px sans"
        this.ctx.lineWidth = 4
        this.ctx.strokeText(`${text}`, 49, 1029)
        this.ctx.fillStyle = "white"
        this.ctx.fillText(`${text}`, 50, 1030)
        this.buffer = await this.canvas.encode('jpeg', 50)
    }
    async drawPoint(point, cornerState) {
        if (!this.ctx) this.createCtx()
        const [x, y] = point
        if (cornerState) {
            this.ctx.beginPath()
            this.ctx.arc(x, y, 30, 0, 2 * Math.PI)
            this.ctx.fillStyle = cornerState ? "#3AFF09" : "#E00606"
            this.ctx.fill()
            this.drawSymbol(x, y, cornerState ? "mark" : "cross")
        }
        this.buffer = await this.canvas.encode('jpeg', 50)
    }
    setBox(x, y) {
        return {
            x: x - 15,
            y: y - 15,
            width: x - 15 + 30,
            height: y - 15 + 30
        }
    }
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {"cross"|"mark"} type 
     */
    drawSymbol(x, y, type) {
        const box = this.setBox(x, y)
        const OFFSET = type === "cross" ? [0,0,0,0] : [17, 15, 2, 11]
        this.ctx.lineWidth = 7
        this.ctx.strokeStyle = "white"
        this.ctx.beginPath()
        this.ctx.moveTo(box.x, box.y + OFFSET[0])
        this.ctx.lineTo(box.width - OFFSET[1], box.height)
        this.ctx.stroke()
        this.ctx.beginPath()
        this.ctx.moveTo(box.width + OFFSET[2], box.y)
        this.ctx.lineTo(box.x + OFFSET[3], box.height)
        this.ctx.stroke()
    }
    async drawCornersState(window) {
        const {bbox, cornersState, currentSide} = window
        if (!this.ctx) this.createCtx()
        const [x, y, width, height] = bbox
        const p1 = [x, y+height]
        const p2 = [x+width, y+height]
        const p3 = [x, y]
        const p4 = [x+width, y]
        let points = []
        points = currentSide === "first" ? [p1,p2,p3,p4] : [p3,p4,p1,p2]
        let promises = []
        //TODO: draw only processed corners
        points.forEach(async (point, i) => promises.push(this.drawPoint(point, cornersState[i])))
        await Promise.all(promises)
        this.buffer = await this.canvas.encode('jpeg', 50)
    }
    
}

module.exports = Drawer