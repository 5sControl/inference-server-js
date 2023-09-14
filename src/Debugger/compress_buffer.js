const {createCanvas, Image} = require('@napi-rs/canvas')
module.exports = async (buffer) => {
    const canvas = createCanvas(640, 360)
    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.src = buffer
    ctx.drawImage(image, 0, 0, image.width/3, image.height/3)
    return buffer = await canvas.encode('jpeg', 20)
}