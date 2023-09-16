const express = require("express");

const router = express.Router()
const conversionCtrl = require('../controller/converterCtrl')
const modelCtrl = require('../controller/modelCtrl')

router.post('/convert/fbx', conversionCtrl.convertFBXToGLB)
router.post('/convert/fbx/gltf', conversionCtrl.convertFBXToGLB)
router.post('/convert/with-blender', conversionCtrl.withBlender)
// router.post('/colorways', colorwaysCtrl.change);

router.get('/initialize', modelCtrl.initialize)

module.exports = router;