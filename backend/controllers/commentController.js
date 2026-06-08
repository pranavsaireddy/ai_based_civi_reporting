const Report = require('../models/Report');
const { addPoints } = require('../utility/gamification');

exports.addCommentToReport = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const newNote = { text, addedBy: req.user.id };
    report.notes.push(newNote);
    await report.save();

    const updatedReport = await Report.findById(req.params.id)
      .populate('notes.addedBy', 'username email');

    const addedNote = updatedReport.notes[updatedReport.notes.length - 1];
    await addPoints(req.user.id, 2);
    res.status(201).json(addedNote);
  } catch (error) {
    next(error);
  }
};


exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('user', 'username email')
      .populate('notes.addedBy', 'username email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const total = report.notes.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedNotes = report.notes
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(startIndex, endIndex);

    const pagination = {};
    if (endIndex < total) pagination.next = { page: parseInt(page) + 1, limit: parseInt(limit) };
    if (startIndex > 0) pagination.prev = { page: parseInt(page) - 1, limit: parseInt(limit) };

    res.status(200).json({
      success: true,
      data: paginatedNotes.map(note => ({
        _id: note._id,
        text: note.text,
        createdAt: note.createdAt,
        addedBy: note.addedBy ? {
          username: note.addedBy.username,
          email: note.addedBy.email
        } : null
      })),
      reportDetails: {
        id: report._id,
        title: report.title,
        description: report.description,
        status: report.status,
        priority: report.priority,
        location: report.location,
        createdBy: {
          username: report.user?.username || "Unknown",
          email: report.user?.email || "N/A"
        }
      },
      total
    });
  } catch (error) {
    next(error);
  }
};
