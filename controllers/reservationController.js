const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateId = require("../utils/generateId");
const { notifyReservationCreated } = require("../utils/mailer");
const {
  mapReservation,
  mapReservationRoom,
  mapReservationTax,
  mapPayment,
} = require("../utils/mappers");

/**
 * Aggregate the taxDetails arrays sent with each booking into a single,
 * de-duplicated list per reservation.
 */
const aggregateTaxes = (bookings) => {
  const map = new Map();

  (bookings || []).forEach((booking) => {
    const details = Array.isArray(booking.taxDetails) ? booking.taxDetails : [];
    details.forEach((tax) => {
      const label = tax.taxLabel || "Tax";
      const amount = Number(tax.taxAmount) || 0;
      const entry = map.get(label) || {
        taxLabel: label,
        amount: 0,
        percentageOrFlatAmount: null,
        type: null,
      };
      entry.amount += amount;
      if (tax.taxPercentage !== null && tax.taxPercentage !== undefined) {
        entry.percentageOrFlatAmount = Number(tax.taxPercentage);
        entry.type = "percentage";
      } else if (tax.flatAmount !== null && tax.flatAmount !== undefined) {
        entry.percentageOrFlatAmount = Number(tax.flatAmount);
        entry.type = "flatAmount";
      }
      map.set(label, entry);
    });
  });

  return [...map.values()];
};

/**
 * POST /api/v1/guests/makeWebReservation
 * Creates a reservation (with rooms, taxes and payment) after Paystack success.
 * Matches the payload built in BookingPage.jsx.
 */
const makeWebReservation = asyncHandler(async (req, res) => {
  const {
    payingGuest = {},
    paymentReference = null,
    totalBill = 0,
    paymentType = null,
    reservationType = "booked",
    hotelName = null,
    hotelId = null,
    numOfDays = 1,
    checkInDate,
    checkOutDate,
    bookingStatus = "unprocessed",
    referralName = null,
    sourceType = null,
    includeBreakfast = null,
    hasTaxLevies = false,
    bookings = [],
    paymentDetails = [],
  } = req.body;

  if (!checkInDate || !checkOutDate) {
    throw new ApiError(400, "checkInDate and checkOutDate are required");
  }
  if (!Array.isArray(bookings) || bookings.length === 0) {
    throw new ApiError(400, "At least one room booking is required");
  }

  // Try to link to a registered guest by email (booking can be made without login).
  let guestId = null;
  const email = payingGuest.email || payingGuest.emailAddress;
  if (email) {
    const [guestRows] = await pool.query(
      "SELECT guest_id FROM guests WHERE email_address = ? LIMIT 1",
      [email]
    );
    if (guestRows.length > 0) guestId = guestRows[0].guest_id;
  }

  const bookingCode = generateId(24);
  const taxes = aggregateTaxes(bookings);

  const connection = await pool.getConnection();
  let reservationId;
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO reservations
         (booking_code, guest_id, hotel_id, hotel_name, paying_guest_title,
          paying_guest_first_name, paying_guest_last_name, paying_guest_email,
          paying_guest_phone, paying_guest_gender, paying_guest_address,
          num_of_days, check_in_date, check_out_date, total_bill,
          payment_reference, payment_type, reservation_type, booking_status,
          source_type, referral_name, include_breakfast, has_tax_levies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingCode,
        guestId,
        hotelId,
        hotelName,
        payingGuest.guestTitle || null,
        payingGuest.firstName || null,
        payingGuest.lastName || null,
        email || null,
        payingGuest.phoneNumber || null,
        payingGuest.gender || null,
        payingGuest.address || null,
        numOfDays,
        checkInDate,
        checkOutDate,
        totalBill,
        paymentReference,
        paymentType,
        reservationType,
        bookingStatus,
        sourceType,
        referralName,
        includeBreakfast,
        hasTaxLevies ? 1 : 0,
      ]
    );
    reservationId = result.insertId;

    // Room line items
    const roomValues = bookings.map((booking) => {
      const qty = Number(booking.qty || booking.quantity || 1);
      const stay = Number(booking.lengthOfStay || numOfDays || 1);
      const roomCost = Number(booking.roomCost) || 0;
      const totalCost =
        booking.totalCost != null
          ? Number(booking.totalCost)
          : roomCost * qty;
      return [
        reservationId,
        booking.roomTypeId || null,
        booking.roomTypeName || null,
        roomCost,
        qty,
        stay,
        Number(booking.totalTaxRoomCat) || 0,
        totalCost,
      ];
    });

    if (roomValues.length > 0) {
      await connection.query(
        `INSERT INTO reservation_rooms
           (reservation_id, room_type_id, room_type_name, room_cost, quantity,
            length_of_stay, total_tax, total_cost)
         VALUES ?`,
        [roomValues]
      );
    }

    // Taxes
    if (taxes.length > 0) {
      const taxValues = taxes.map((tax) => [
        reservationId,
        tax.taxLabel,
        tax.amount,
        tax.percentageOrFlatAmount,
        tax.type,
      ]);
      await connection.query(
        `INSERT INTO reservation_taxes
           (reservation_id, tax_label, amount, percentage_or_flat_amount, type)
         VALUES ?`,
        [taxValues]
      );
    }

    // Payments
    const payments = Array.isArray(paymentDetails) ? paymentDetails : [];
    if (payments.length > 0) {
      const paymentValues = payments.map((payment) => [
        reservationId,
        payment.paymentType || paymentType,
        Number(payment.amount) || 0,
        payment.bankName || null,
        payment.transactionId || null,
        payment.managerName || null,
        payment.referenceNumber || null,
        payment.creditId || null,
      ]);
      await connection.query(
        `INSERT INTO payments
           (reservation_id, payment_type, amount, bank_name, transaction_id,
            manager_name, reference_number, credit_id)
         VALUES ?`,
        [paymentValues]
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  let hotelAddress = "";
  if (hotelId) {
    const [hotelRows] = await pool.query(
      `SELECT address, location, state_name, lga_name
         FROM hotels
        WHERE hotel_id = ?
        LIMIT 1`,
      [hotelId]
    );

    if (hotelRows.length > 0) {
      const hotel = hotelRows[0];
      hotelAddress =
        hotel.address ||
        [hotel.lga_name, hotel.state_name].filter(Boolean).join(", ") ||
        hotel.location ||
        "";
    }
  }

  notifyReservationCreated({
    bookingCode,
    reservationId,
    hotelName,
    hotelAddress,
    email,
    payingGuest,
    checkInDate,
    checkOutDate,
    numOfDays,
    totalBill,
    paymentReference,
    paymentType,
    sourceType,
    referralName,
    bookings,
    taxes,
  }).catch((err) => {
    console.error("[mail] Reservation notification failed:", err.message);
  });

  res.status(201).json({
    success: true,
    message: "Reservation created successfully",
    bookingCode,
    reservationId,
  });
});

/**
 * GET /api/v1/admin/reservations
 * Optional filters: status, hotelId, search (email or booking code)
 */
const listReservations = asyncHandler(async (req, res) => {
  const { status, hotelId, search } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push("booking_status = ?");
    params.push(status);
  }
  if (hotelId) {
    conditions.push("hotel_id = ?");
    params.push(hotelId);
  }
  if (search) {
    conditions.push(
      "(booking_code LIKE ? OR paying_guest_email LIKE ? OR paying_guest_last_name LIKE ?)"
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM reservations ${where} ORDER BY created_at DESC`,
    params
  );

  res
    .status(200)
    .json({ success: true, count: rows.length, reservations: rows.map(mapReservation) });
});

/**
 * GET /api/v1/admin/reservations/:reservationId
 * Includes rooms, taxes and payments.
 */
const getReservation = asyncHandler(async (req, res) => {
  const { reservationId } = req.params;

  const [rows] = await pool.query(
    "SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1",
    [reservationId]
  );
  if (rows.length === 0) {
    throw new ApiError(404, "Reservation not found");
  }

  const reservation = mapReservation(rows[0]);

  const [rooms] = await pool.query(
    "SELECT * FROM reservation_rooms WHERE reservation_id = ?",
    [reservationId]
  );
  const [taxes] = await pool.query(
    "SELECT * FROM reservation_taxes WHERE reservation_id = ?",
    [reservationId]
  );
  const [payments] = await pool.query(
    "SELECT * FROM payments WHERE reservation_id = ?",
    [reservationId]
  );

  reservation.rooms = rooms.map(mapReservationRoom);
  reservation.taxes = taxes.map(mapReservationTax);
  reservation.payments = payments.map(mapPayment);

  res.status(200).json({ success: true, reservation });
});

/**
 * PATCH /api/v1/admin/reservations/:reservationId/status
 * Body: { bookingStatus }
 */
const updateReservationStatus = asyncHandler(async (req, res) => {
  const { reservationId } = req.params;
  const { bookingStatus } = req.body;

  const [result] = await pool.query(
    "UPDATE reservations SET booking_status = ? WHERE reservation_id = ?",
    [bookingStatus, reservationId]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Reservation not found");
  }

  res
    .status(200)
    .json({ success: true, message: "Reservation status updated" });
});

/**
 * DELETE /api/v1/admin/reservations/:reservationId
 */
const deleteReservation = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    "DELETE FROM reservations WHERE reservation_id = ?",
    [req.params.reservationId]
  );
  if (result.affectedRows === 0) {
    throw new ApiError(404, "Reservation not found");
  }
  res.status(200).json({ success: true, message: "Reservation deleted" });
});

module.exports = {
  makeWebReservation,
  listReservations,
  getReservation,
  updateReservationStatus,
  deleteReservation,
};
