const db = require("./DB")
const compress_buffer = require("./compress_buffer")

dispatcher.on("container started", async () => {
    const record = {
        id: process.env.launch,
        envs: { WORKSPACE_ZONE: global.WORKSPACE_ZONE },
        is_test
    }
    db.insert("launches", record)
})

dispatcher.on("snapshot checked", async ({snapshot}) => {
    const {launch, index, received, detections} = snapshot
    const record = {launch, index, received, detections}
    db.insert("timeline", record)
    snapshot.compressed_buffer = await compress_buffer(snapshot.buffer)
    db.upload(snapshot)
})

dispatcher.on("machine: report", async ({snapshots_for_report}) => {
    if (!snapshots_for_report[0]) {
        snapshots_for_report[0] = snapshots_for_report[1]
    }
    let cleaned_snapshots = []
    for (const snapshot of snapshots_for_report) {
        const {received, index} = snapshot
        cleaned_snapshots.push({received, index})
    }
    const record = {
        control_name: "machine",
        launch: snapshots_for_report[0].launch,
        snapshots: cleaned_snapshots
    }
    db.insert("reports", record)
})