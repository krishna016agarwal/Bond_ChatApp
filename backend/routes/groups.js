const router = require("express").Router();

const {
  createGroup,
  getUserGroups,
  addGroupMembers,
  leaveGroup,
  deleteGroup,
  kickMember,
  updateGroupAvatar,
  renameGroup,
} = require("../controllers/groups");

router.post("/create", createGroup);
router.get("/:userId", getUserGroups);
router.post("/add-members/:groupId", addGroupMembers);
router.post("/leave/:groupId", leaveGroup);
router.post("/kick/:groupId", kickMember);
router.post("/avatar/:groupId", updateGroupAvatar);
router.post("/rename/:groupId", renameGroup);
router.delete("/:groupId", deleteGroup);

module.exports = router;
