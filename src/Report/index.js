const fs = require('fs')
const crypto = require('crypto')
const draw_detections = require('./draw_detections.js')
const {djangoDate} = require('../utils/Date')

const report = {
    async add(snapshot, isDanger, camera_ip) {
        let drawed_snapshot = await draw_detections(snapshot, isDanger)
        const imagePath = this.upload(drawed_snapshot.buffer, camera_ip)
        const photoRecord = {"image": imagePath, "date": djangoDate(new Date(snapshot.received))}
        return photoRecord
    },
    /**
     * @param {Buffer} buffer from Drawer
     * @returns {string} imagePath
     */
    upload(buffer, camera_ip) {
        const imagePath = `images/${camera_ip}/${crypto.randomUUID()}.jpeg`
        fs.writeFile(
            imagePath,
            buffer,
            error => { if (error) console.log(error) }
        )
        return imagePath
    },
    send(photos_for_report, extra, camera_ip) {
        const json = {
            "algorithm": process.env.algorithm_name || "machine_control_js",
            "camera": camera_ip,
            "start_tracking": photos_for_report[0].date,
            "stop_tracking": photos_for_report[photos_for_report.length - 1].date,
            "photos": photos_for_report,
            "violation_found": true,
            "extra": extra
        }
        const body = JSON.stringify(json, null, 2)

        fetch(process.env.link_reports, {
            method: "POST",
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body
        })
        .then(r => r.text())
        .then(response => { console.log("server response", response) })
        .catch(err => { console.log("error report send", err.code) })

        if (photos_for_report.length !== 4) {
            console.log("report sended", body)
        }
    },
    async prepare(snapshots, extra, camera_ip) {
        if (snapshots.length !== 4) {
            console.log("start prepare snapshots", snapshots, extra)
        }
        let photos_for_report = []
        for (const [i, snapshot] of snapshots.entries()) {
            const record = await this.add(snapshot, isDanger = [1,2].includes(i), camera_ip)
            photos_for_report.push(record)
        }
        if (photos_for_report.length !== 4) {                
            console.log("photos_for_report incorrect size after preparing", photos_for_report)
        }
        this.send(photos_for_report, extra, camera_ip)
    }
}

module.exports = report