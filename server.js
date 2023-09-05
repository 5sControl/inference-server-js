const detector = require('./src/Detector')
const report = require('./src/Report')
const express = require('express')
const HOST = process.env.server_url || '0.0.0.0'
const PORT = 9999
const app = express()
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })
app.post('/detect', upload.fields([{name: "buffer"}, {name: "zone"}]), async (req, res) => {
	try {
		if (req.files.buffer[0].buffer && req.body.zone) {
			const detections = await detector.detect(req.files.buffer[0].buffer, JSON.parse(req.body.zone))
			res.json(detections)
		} else {
			res.json({answer: "something not sended"})
		}
	} catch (error) {
		console.log(error)
		res.json({error})
	}
})
app.post('/report', upload.fields([{name: "snapshots"}]), async (req, res) => {
	try {
		if (req.files.snapshots[0].buffer && req.body.extra && req.body.camera_ip) {
			let received_snapshots = JSON.parse(req.body.flattened_snapshots)
			for (const [i, snapshot] of received_snapshots.entries()) {
				snapshot.buffer = req.files.snapshots[i].buffer
			}
			await report.prepare(
				received_snapshots,
				JSON.parse(req.body.extra),
				req.body.camera_ip
			)
			res.json({sended: "ok"})
		} else {
			res.json({answer: "something not sended"})
		}
	} catch (error) {
		console.log(error)
		res.json({error})
	}
})
app.listen(PORT, HOST, async () => {
	await detector.init()
	console.log(`Running on http://${HOST}:${PORT}`)
})