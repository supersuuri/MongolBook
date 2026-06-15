const router = require("express").Router();
const ctrl = require("../controllers/staffController");
const { protect } = require("../middleware/auth");

router.get("/", ctrl.listStaff);
router.post("/", protect, ctrl.createStaff);
router.put("/:id", protect, ctrl.updateStaff);
router.delete("/:id", protect, ctrl.deleteStaff);

module.exports = router;
