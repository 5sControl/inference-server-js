const detector = require('./src/Detector')
const express = require('express')
const HOST = process.env.server_url || '0.0.0.0'
const PORT = 9999
const app = express()
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })
app.post('/detect', upload.fields([{name: "buffer"}, {name: "zone"}]), async (req, res) => {
	console.log(req.rawHeaders)
	try {
		if (req.files.buffer[0].buffer && req.body.zone) {
			// const detections = await detector.detect(req.files.buffer[0].buffer, JSON.parse(req.body.zone))
			const detections = []
			console.log(detections)
			res.json(detections)
		} else {
			res.json({answer: "something not sended"})
		}
	} catch (error) {
		console.log(error)	
	}
})
app.listen(PORT, HOST, () => console.log(`Running on http://${HOST}:${PORT}`))