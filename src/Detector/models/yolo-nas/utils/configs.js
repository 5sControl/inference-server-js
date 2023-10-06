const COCO_LABELS = require("./labels.json")

class Configs {

    baseModelURL = `${process.env.PUBLIC_URL}/model`;
    prepSteps = [
      { DetLongMaxRescale: null },
      { CenterPad: { pad_value: 114 } },
      { Standardize: { max_value: 255.0 } },
    ];
    labels = COCO_LABELS;

    constructor(inputShape, scoreThresh, iouThresh, topk, customMetadata = null) {
      this.inputShape = inputShape;
      this.scoreThresh = scoreThresh;
      this.iouThresh = iouThresh;
      this.topk = topk;
      this.customMetadata = customMetadata;
    }

    async _loadMetadata() {
      const res = await fetch(`${this.baseModelURL}/${this.customMetadata}`);
      const metadata = await res.json();

      this.scoreThresh = metadata["score_thres"];
      this.iouThresh = metadata["iou_thres"];
      this.prepSteps = metadata["prep_steps"];
      this.labels = metadata["labels"];

      if (JSON.stringify(this.inputShape) !== JSON.stringify(metadata["original_insz"]))
        alert("Model have different input shape from what included in metadata!");
    }

    async init() {
      if (this.customMetadata) await this._loadMetadata();
    }
	
}

module.exports = Configs