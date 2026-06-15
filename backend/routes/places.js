const router = require("express").Router();
const ctrl = require("../controllers/placeController");
const { protect } = require("../middleware/auth");

router.get("/", ctrl.listPlaces);
router.get("/nearby", ctrl.getNearbyPlaces);
router.get("/mine", protect, ctrl.getMyPlaces);
router.get("/:id", ctrl.getPlaceById);

router.post("/", protect, ctrl.createPlace);
router.put("/:id", protect, ctrl.updatePlace);
router.delete("/:id", protect, ctrl.deletePlace);

module.exports = router;
