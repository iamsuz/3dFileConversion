const express = require("express");

const router = express.Router()
const conversionCtrl = require('../controller/converterCtrl')

router.post('/convert/fbx', conversionCtrl.convertFBXToGLB)
router.post('/convert/fbx/gltf', conversionCtrl.convertFBXToGLB)
router.post('/convert/with-blender', conversionCtrl.withBlender)
router.post('/colorways', colorwaysCtrl.change);

module.exports = router;