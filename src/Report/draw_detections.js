const {createCanvas, Image} = require('@napi-rs/canvas')

async function draw_detections(snapshot, isDanger) {
    const canvas = createCanvas(1920, 1080)
    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.src = snapshot.buffer
    ctx.drawImage(image, 0, 0)
    draw_box(ctx, snapshot.zoneBbox, isDanger ? "red" : "green")
    for (const person of snapshot.detections) {
        // const color = person.isIntersect ? "yellow" : "aqua"
        const color = "aqua"
        draw_box(ctx, person.bbox, color, person.score)
    }
    snapshot.buffer = await canvas.encode('jpeg', 50)
    return snapshot
}
function draw_box(ctx, rect, color, score) {
    const [x, y, width, height] = rect
    ctx.lineWidth = 10
    ctx.strokeStyle = color
    ctx.strokeRect(x, y, width, height)
    if (score) {
        ctx.font = "48px serif"
        ctx.fillStyle = "orange"
        ctx.fillText(`${Math.floor(score * 100)}`, x - 20, y - 20)
    }
}

module.exports = draw_detections