const router = require("express").Router();
const ctrl = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.get("/", protect, ctrl.listNotifications);
router.patch("/read-all", protect, ctrl.markAllRead);
router.patch("/:id/read", protect, ctrl.markNotificationRead);

module.exports = router;
