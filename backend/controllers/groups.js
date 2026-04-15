const mongoose = require("mongoose");
const Group = require("../models/group");

module.exports.createGroup = async (req, res) => {
  try {
    const { name, adminId, members = [] } = req.body;

    if (!name || !adminId) {
      return res.json({ status: false, message: "Group name and admin are required" });
    }

    const uniqueMembers = [...new Set([adminId, ...members])];

    const group = await Group.create({
      name,
      createdBy: adminId,
      admins: [adminId],
      members: uniqueMembers,
    });

    const populated = await Group.findById(group._id)
      .populate("members", "_id username avatarImage")
      .populate("admins", "_id username");

    return res.json({ status: true, group: populated });
  } catch (error) {
    return res.json({ status: false, message: "Unable to create group", error });
  }
};

module.exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.params.userId;

    const groups = await Group.find({ members: userId })
      .populate("members", "_id username avatarImage")
      .populate("admins", "_id username")
      .sort({ updatedAt: -1 });

    return res.json({ status: true, groups });
  } catch (error) {
    return res.json({ status: false, message: "Unable to fetch groups", error });
  }
};

module.exports.addGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId, members = [] } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ status: false, message: "Group not found" });
    }

    const isAdmin = group.admins.some((id) => String(id) === String(adminId));
    if (!isAdmin) {
      return res.json({ status: false, message: "Only admin can add members" });
    }

    const mergedMembers = new Set(group.members.map((id) => String(id)));
    members.forEach((memberId) => mergedMembers.add(String(memberId)));

    group.members = Array.from(mergedMembers).map((id) => new mongoose.Types.ObjectId(id));
    await group.save();

    const populated = await Group.findById(group._id)
      .populate("members", "_id username avatarImage")
      .populate("admins", "_id username");

    return res.json({ status: true, group: populated });
  } catch (error) {
    return res.json({ status: false, message: "Unable to add members", error });
  }
};

module.exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ status: false, message: "Group not found" });
    }

    group.members = group.members.filter((id) => String(id) !== String(userId));
    group.admins = group.admins.filter((id) => String(id) !== String(userId));

    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.json({ status: true, deleted: true, groupId });
    }

    if (group.admins.length === 0) {
      group.admins = [group.members[0]];
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate("members", "_id username avatarImage")
      .populate("admins", "_id username");

    return res.json({ status: true, group: populated });
  } catch (error) {
    return res.json({ status: false, message: "Unable to leave group", error });
  }
};

module.exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ status: false, message: "Group not found" });
    }

    const isAdmin = group.admins.some((id) => String(id) === String(adminId));
    if (!isAdmin) {
      return res.json({ status: false, message: "Only admin can delete group" });
    }

    await Group.findByIdAndDelete(groupId);
    return res.json({ status: true, groupId });
  } catch (error) {
    return res.json({ status: false, message: "Unable to delete group", error });
  }
};

module.exports.kickMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId, memberId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ status: false, message: "Group not found" });
    }

    const isAdmin = group.admins.some((id) => String(id) === String(adminId));
    if (!isAdmin) {
      return res.json({ status: false, message: "Only admin can kick members" });
    }

    if (String(adminId) === String(memberId)) {
      return res.json({ status: false, message: "Admin cannot kick self" });
    }

    group.members = group.members.filter((id) => String(id) !== String(memberId));
    group.admins = group.admins.filter((id) => String(id) !== String(memberId));

    await group.save();

    const populated = await Group.findById(group._id)
      .populate("members", "_id username avatarImage")
      .populate("admins", "_id username");

    return res.json({ status: true, group: populated });
  } catch (error) {
    return res.json({ status: false, message: "Unable to kick member", error });
  }
};

module.exports.updateGroupAvatar = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId, avatarImage } = req.body;

    if (!avatarImage) {
      return res.json({ status: false, message: "Avatar image is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ status: false, message: "Group not found" });
    }

    const isAdmin = group.admins.some((id) => String(id) === String(adminId));
    if (!isAdmin) {
      return res.json({ status: false, message: "Only admin can change group avatar" });
    }

    group.avatarImage = avatarImage;
    group.isAvatarImageSet = true;
    await group.save();

    const populated = await Group.findById(group._id)
      .populate("members", "_id username avatarImage")
      .populate("admins", "_id username");

    return res.json({ status: true, group: populated });
  } catch (error) {
    return res.json({ status: false, message: "Unable to update group avatar", error });
  }
};

module.exports.renameGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId, name } = req.body;

    if (!name || !name.trim()) {
      return res.json({ status: false, message: "Group name is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ status: false, message: "Group not found" });
    }

    const isAdmin = group.admins.some((id) => String(id) === String(adminId));
    if (!isAdmin) {
      return res.json({ status: false, message: "Only admin can rename group" });
    }

    group.name = name.trim();
    await group.save();

    const populated = await Group.findById(group._id)
      .populate("members", "_id username avatarImage")
      .populate("admins", "_id username");

    return res.json({ status: true, group: populated });
  } catch (error) {
    return res.json({ status: false, message: "Unable to rename group", error });
  }
};
