const {createCanvas, Image} = require('@napi-rs/canvas')

async function draw_detections(snapshot, isDanger) {
    const canvas = createCanvas(1920, 1080)
    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.src = snapshot.buffer
    ctx.drawImage(image, 0, 0)
    draw_box(ctx, snapshot.zoneBbox, isDanger ? "red" : "green")
    for (const person of snapshot.detections) {
        draw_box(ctx, person.bbox, "blue")
    }
    snapshot.buffer = await canvas.encode('jpeg', 50)
    return snapshot
}
function draw_box(ctx, rect, color) {
    const [x, y, width, height] = rect
    ctx.lineWidth = 10
    ctx.strokeStyle = color
    ctx.strokeRect(x, y, width, height)
}

module.exports = draw_detections