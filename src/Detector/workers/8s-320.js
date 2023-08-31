const workerpool = require('workerpool')
const loadYoloV8 = require('../models/yolov8')

loadYoloV8(`./yolov8s-320_web_model/model.json`)
.then(model => workerpool.worker({detect: model.detect}))