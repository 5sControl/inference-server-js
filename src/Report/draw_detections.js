const {createCanvas, Image} = require('canvas')

async function draw_detections(snapshot, isDanger) {
    const canvas = createCanvas(1920, 1080)
    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.src = snapshot.buffer
    ctx.drawImage(image, 0, 0)
    draw_box(ctx, snapshot.zoneBbox, isDanger ? "red" : "green")
    for (const person of snapshot.detections) {
        const color = "aqua"
        draw_box(ctx, person.bbox, color, person.score, snapshot.detectedBy)
    }
    snapshot.buffer = canvas.toBuffer('image/jpeg', { quality: 0.5 })
    return snapshot
}
function draw_box(ctx, rect, color, score, letter) {
    const [x, y, width, height] = rect
    ctx.lineWidth = 10
    ctx.strokeStyle = color
    ctx.strokeRect(x, y, width, height)
    if (score) {
        ctx.fillStyle = "white"
        ctx.fillRect(x + 5, y - 30, 40, 30)
        ctx.fillStyle = "black"
        ctx.font = "bold 30px sans"
        ctx.fillText(`${Math.floor(score * 100)}`, x + 7, y - 5)
    }
}

module.exports = draw_detections