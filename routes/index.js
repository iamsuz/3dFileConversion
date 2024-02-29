const express = require("express");

const router = express.Router()
const conversionCtrl = require('../controller/converterCtrl')
const modelCtrl = require('../controller/modelCtrl')
const renderCtrl = require('../controller/renderCtrl')

router.post('/convert/fbx', conversionCtrl.convertFBXToGLB)
router.post('/convert/fbx/gltf', conversionCtrl.convertFBXToGLB)
router.post('/convert/with-blender', conversionCtrl.withBlender)
// router.post('/colorways', colorwaysCtrl.change);

router.post('/render/image', renderCtrl.initialize)

router.post('/initialize', modelCtrl.initialize)

module.exports = router;