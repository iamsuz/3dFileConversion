const express = require("express");

const router = express.Router()
const conversionCtrl = require('../controller/converterCtrl')

router.post('/convert/fbx', conversionCtrl.convertFBXToGLTF)
router.post('/convert/with/blender' , conversionCtrl.withBlender)

module.exports = router;