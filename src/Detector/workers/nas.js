const workerpool = require('workerpool')
const loadYoloNAS = require('../models/yolo-nas')

loadYoloNAS()
.then(model => workerpool.worker({detect: model.detect}))