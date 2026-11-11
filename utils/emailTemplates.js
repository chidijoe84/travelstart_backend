const OFFICIAL_EMAIL =
  process.env.BOOKINGS_EMAIL || "bookings@travelstartagency.com";

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char])
  );

const formatCurrency = (value) => {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return `NGN ${safeAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
};

const guestName = (guest = {}) =>
  [guest.guestTitle, guest.firstName, guest.lastName]
    .filter(Boolean)
    .join(" ") || "Guest";

const listingLocation = (listing) =>
  listing.city ||
  [listing.lgaName, listing.stateName].filter(Boolean).join(", ") ||
  "Not provided";

const detailTable = (rows) => {
  const visibleRows = rows.filter(
    (row) => row && row.value !== undefined && row.value !== null && row.value !== ""
  );

  if (visibleRows.length === 0) return "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 0;">
      ${visibleRows
        .map((row) => {
          const value = row.href
            ? `<a href="${escapeHtml(row.href)}" style="color:#2f7d76;text-decoration:none;">${escapeHtml(row.value)}</a>`
            : escapeHtml(row.value).replace(/\r?\n/g, "<br />");

          return `
            <tr>
              <td style="padding:10px 12px 10px 0;border-bottom:1px solid #edf3f0;color:#7a8a84;font-size:13px;line-height:1.5;vertical-align:top;width:42%;">${escapeHtml(row.label)}</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf3f0;color:#16302b;font-size:14px;line-height:1.5;vertical-align:top;">${value}</td>
            </tr>`;
        })
        .join("")}
    </table>`;
};

const layout = ({ preheader, heading, intro, rows, footerNote }) => {
  const footer =
    footerNote ||
    `Need help? Contact us at <a href="mailto:${escapeHtml(OFFICIAL_EMAIL)}" style="color:#2f7d76;text-decoration:none;">${escapeHtml(OFFICIAL_EMAIL)}</a>.`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f8f6;font-family:Arial,Helvetica,sans-serif;color:#16302b;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e0ece7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#16302b;background-image:linear-gradient(135deg,#16302b,#24544c);padding:28px 32px;text-align:center;">
                <img src="cid:travelstart-logo" alt="Travel Start" width="210" height="70" style="display:block;width:210px;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px;">
                <p style="margin:0 0 18px;color:#44514c;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
                ${detailTable(rows)}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9fcfb;border-top:1px solid #edf3f0;color:#7a8a84;font-size:12px;line-height:1.6;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const textDetails = (rows) =>
  rows
    .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== "")
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");

const roomRows = (reservation) =>
  (reservation.bookings || []).map((booking, index) => {
    const quantity = Number(booking.qty || booking.quantity || 1);
    const stay = Number(
      booking.lengthOfStay || reservation.numOfDays || 1
    );
    const cost =
      booking.totalCost != null
        ? Number(booking.totalCost)
        : (Number(booking.roomCost) || 0) * quantity;

    return {
      label: `Room ${index + 1}`,
      value: `${quantity} x ${booking.roomTypeName || "Room"} (${stay} night${
        stay === 1 ? "" : "s"
      }) - ${formatCurrency(cost)}`,
    };
  });

const buildReservationGuestEmail = (reservation) => {
  const name = guestName(reservation.payingGuest);
  const rows = [
    { label: "Booking code", value: reservation.bookingCode },
    {
      label: "Hotel",
      value: reservation.hotelName || "Travel Start Hotel",
    },
    {
      label: "Hotel address",
      value: reservation.hotelAddress || "",
    },
    { label: "Check-in", value: formatDate(reservation.checkInDate) },
    { label: "Check-out", value: formatDate(reservation.checkOutDate) },
    { label: "Nights", value: String(reservation.numOfDays || 1) },
    ...roomRows(reservation),
    { label: "Total", value: formatCurrency(reservation.totalBill) },
    {
      label: "Payment reference",
      value: reservation.paymentReference || "",
    },
  ];

  const subject = `Reservation received - ${reservation.bookingCode}`;
  const heading = "Reservation received";
  const intro = `Hi ${name}, thank you for your reservation at ${
    reservation.hotelName || "Travel Start"
  }. We have received your booking and will contact you if we need anything else.`;

  return {
    subject,
    html: layout({
      preheader: `Your reservation ${reservation.bookingCode} has been received.`,
      heading,
      intro,
      rows,
      footerNote: `Please keep your booking code handy. For changes or questions, contact us at <a href="mailto:${escapeHtml(
        OFFICIAL_EMAIL
      )}" style="color:#2f7d76;text-decoration:none;">${escapeHtml(
        OFFICIAL_EMAIL
      )}</a>.`,
    }),
    text: `${heading}\n\n${intro}\n\n${textDetails(rows)}\n\nNeed help? Contact us at ${OFFICIAL_EMAIL}.`,
  };
};

const buildReservationAdminEmail = (reservation) => {
  const guest = reservation.payingGuest || {};
  const rows = [
    { label: "Booking code", value: reservation.bookingCode },
    { label: "Reservation ID", value: String(reservation.reservationId) },
    { label: "Guest", value: guestName(guest) },
    {
      label: "Guest email",
      value: reservation.email || "",
      href: reservation.email ? `mailto:${reservation.email}` : "",
    },
    {
      label: "Guest phone",
      value: guest.phoneNumber || "",
      href: guest.phoneNumber ? `tel:${guest.phoneNumber}` : "",
    },
    {
      label: "Hotel",
      value: reservation.hotelName || "Travel Start Hotel",
    },
    {
      label: "Hotel address",
      value: reservation.hotelAddress || "",
    },
    { label: "Check-in", value: formatDate(reservation.checkInDate) },
    { label: "Check-out", value: formatDate(reservation.checkOutDate) },
    { label: "Nights", value: String(reservation.numOfDays || 1) },
    ...roomRows(reservation),
    { label: "Total", value: formatCurrency(reservation.totalBill) },
    {
      label: "Payment reference",
      value: reservation.paymentReference || "",
    },
    { label: "Payment type", value: reservation.paymentType || "" },
    { label: "Source", value: reservation.sourceType || "" },
    { label: "Referral", value: reservation.referralName || "" },
    {
      label: "Guest address",
      value: guest.address || "",
    },
    { label: "Submitted", value: formatDateTime(new Date()) },
  ];

  const subject = `New reservation - ${reservation.bookingCode}`;
  const heading = "New reservation received";
  const intro = `A new reservation has been received at ${
    reservation.hotelName || "Travel Start"
  }. Please review the details below and follow up with the guest if needed.`;

  return {
    subject,
    html: layout({
      preheader: `New reservation ${reservation.bookingCode}.`,
      heading,
      intro,
      rows,
    }),
    text: `${heading}\n\n${intro}\n\n${textDetails(rows)}\n\nContact: ${OFFICIAL_EMAIL}.`,
  };
};

const buildListingGuestEmail = (listing) => {
  const rows = [
    {
      label: "Request ID",
      value: String(listing.listingId || listing.requestId || ""),
    },
    { label: "Property", value: listing.propertyName },
    { label: "Property type", value: listing.propertyType },
    { label: "Location", value: listingLocation(listing) },
    { label: "Rooms", value: String(listing.rooms || 0) },
    {
      label: "Nearest landmark",
      value: listing.nearestLandmark || "",
    },
    {
      label: "Submitted",
      value: formatDateTime(listing.createdAt),
    },
  ];

  const subject = `Property listing received - ${
    listing.listingId || listing.requestId
  }`;
  const heading = "We received your property listing";
  const intro = `Hi ${listing.contactName}, thank you for submitting ${
    listing.propertyName
  } to Travel Start. We have received your listing and our team will review it.`;

  return {
    subject,
    html: layout({
      preheader: `Your property listing ${listing.propertyName} has been received.`,
      heading,
      intro,
      rows,
      footerNote: `Submitting a property does not guarantee that it will be listed. We will contact you if we need more information, or you can reach us at <a href="mailto:${escapeHtml(
        OFFICIAL_EMAIL
      )}" style="color:#2f7d76;text-decoration:none;">${escapeHtml(
        OFFICIAL_EMAIL
      )}</a>.`,
    }),
    text: `${heading}\n\n${intro}\n\n${textDetails(
      rows
    )}\n\nSubmitting a property does not guarantee that it will be listed.\n\nContact us at ${OFFICIAL_EMAIL}.`,
  };
};

const buildListingAdminEmail = (listing) => {
  const rows = [
    {
      label: "Request ID",
      value: String(listing.listingId || listing.requestId || ""),
    },
    { label: "Property", value: listing.propertyName },
    { label: "Property type", value: listing.propertyType },
    { label: "Contact person", value: listing.contactName },
    {
      label: "Contact email",
      value: listing.email || "",
      href: listing.email ? `mailto:${listing.email}` : "",
    },
    {
      label: "Contact phone",
      value: listing.phone || "",
      href: listing.phone ? `tel:${listing.phone}` : "",
    },
    { label: "Location", value: listingLocation(listing) },
    {
      label: "Nearest landmark",
      value: listing.nearestLandmark || "",
    },
    {
      label: "Coordinates",
      value:
        listing.latitude !== null && listing.longitude !== null
          ? `${listing.latitude}, ${listing.longitude}`
          : "",
    },
    { label: "Rooms", value: String(listing.rooms || 0) },
    { label: "Message", value: listing.message || "" },
    {
      label: "Terms accepted",
      value: listing.termsAccepted
        ? `Yes${
            listing.termsAcceptedAt
              ? ` on ${formatDateTime(listing.termsAcceptedAt)}`
              : ""
          }`
        : "No",
    },
    {
      label: "Submitted",
      value: formatDateTime(listing.createdAt),
    },
    ...(listing.images || []).map((url, index) => ({
      label: `Image ${index + 1}`,
      value: "View image",
      href: url,
    })),
  ];

  const subject = `New property listing - ${listing.propertyName}`;
  const heading = "New property listing submitted";
  const intro = `A new property listing has been submitted through the website by ${listing.contactName}. Please review the details below.`;

  return {
    subject,
    html: layout({
      preheader: `New property listing: ${listing.propertyName}.`,
      heading,
      intro,
      rows,
    }),
    text: `${heading}\n\n${intro}\n\n${textDetails(rows)}\n\nContact: ${OFFICIAL_EMAIL}.`,
  };
};

module.exports = {
  OFFICIAL_EMAIL,
  buildReservationGuestEmail,
  buildReservationAdminEmail,
  buildListingGuestEmail,
  buildListingAdminEmail,
};
