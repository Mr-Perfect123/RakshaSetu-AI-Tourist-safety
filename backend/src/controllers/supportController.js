const SupportTicket = require('../models/SupportTicket');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

class SupportController {
  static createTicket = asyncHandler(async (req, res) => {
    const { category, subject, description, priority } = req.body;
    if (!subject || !description) {
      throw new ApiError(400, 'Subject and description are required for support ticket submission.');
    }
    const ticket = await SupportTicket.create({
      user_id: req.user.id,
      category,
      subject,
      description,
      priority
    });
    return res.status(201).json(new ApiResponse(201, ticket, 'Customer support ticket created successfully.'));
  });

  static getUserTickets = asyncHandler(async (req, res) => {
    const tickets = await SupportTicket.findByUserId(req.user.id);
    return res.status(200).json(new ApiResponse(200, tickets, 'User support tickets fetched successfully.'));
  });

  static getAllTickets = asyncHandler(async (req, res) => {
    const { status, priority } = req.query;
    const tickets = await SupportTicket.findAll({ status, priority });
    return res.status(200).json(new ApiResponse(200, tickets, 'All customer support tickets fetched successfully.'));
  });

  static updateTicketStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;
    const updated = await SupportTicket.updateStatus(id, status, resolution_notes, req.user.id);
    return res.status(200).json(new ApiResponse(200, updated, 'Ticket status updated successfully.'));
  });
}

module.exports = SupportController;
