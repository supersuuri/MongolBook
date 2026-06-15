const router = require("express").Router();
const ctrl = require("../controllers/serviceController");
const { protect } = require("../middleware/auth");

router.get("/", ctrl.listServices);
router.post("/", protect, ctrl.createService);
router.put("/:id", protect, ctrl.updateService);
router.delete("/:id", protect, ctrl.deleteService);

module.exports = router;
