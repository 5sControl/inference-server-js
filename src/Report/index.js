const fs = require('fs')
const crypto = require('crypto')
const draw_detections = require('./draw_detections.js')
const {djangoDate} = require('../utils/Date')

const report = {
    photos: [],
    async add(snapshot, isDanger, camera_ip) {
        let drawed_snapshot = await draw_detections(snapshot, isDanger)
        const imagePath = this.upload(drawed_snapshot.buffer, camera_ip)
        const photoRecord = {"image": imagePath, "date": djangoDate(new Date(snapshot.received))}
        this.photos.push(photoRecord)
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
    send(extra, camera_ip) {
        const json = {
            "algorithm": "machine_control_js",
            "camera": camera_ip,
            "start_tracking": this.photos[0].date,
            "stop_tracking": this.photos[this.photos.length - 1].date,
            "photos": this.photos,
            "violation_found": true,
            "extra": extra
        }
        const body = JSON.stringify(json, null, 2)

        fetch(`http://${process.env.server_url}:80/api/reports/report-with-photos/`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body
        })
        .then(r => r.text())
        .then(response => { console.log("server response", response) })
        .catch(err => { console.log("error report send", err.code) })

        if (this.photos.length !== 4) {
            console.log("report sended", body)
        }
        this.photos = []
    },
    async prepare(snapshots, extra, camera_ip) {
        for (const [i, snapshot] of snapshots.entries()) {
            await this.add(snapshot, isDanger = [1,2].includes(i), camera_ip)
        }
        this.send(extra, camera_ip)
    }
    // dispatcher.on("machine: report", async ({snapshots_for_report}) => {

        // debugBD.report(report)

    //     let cleaned_snapshots = []
    //     for (const snapshot of snapshots_for_report) {
    //         const {received, index} = snapshot
    //         cleaned_snapshots.push({received, index})
    //     }
    
    //     const record = {
    //         control_name: "machine",
    //         snapshots: cleaned_snapshots
    //     }
    //     db.insert("reports", record)
    // })
}

module.exports = report