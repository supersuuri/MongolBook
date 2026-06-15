const router = require("express").Router();
const ctrl = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

router.get("/availability", ctrl.getAvailability);
router.get("/booked-targets", ctrl.getBookedTargets);
router.get("/my", protect, ctrl.listMyBookings);
router.get("/admin", protect, ctrl.listAdminBookings);

router.post("/", protect, ctrl.createBooking);
router.put("/:id/confirm", protect, ctrl.confirmBooking);
router.put("/:id/reject", protect, ctrl.rejectBooking);
router.put("/:id/paid", protect, ctrl.markBookingPaid);
router.put("/:id/complete", protect, ctrl.completeBooking);
router.put("/:id/cancel", protect, ctrl.cancelBooking);
router.post("/:id/review", protect, ctrl.reviewBooking);

module.exports = router;
