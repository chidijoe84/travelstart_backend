/**
 * Convert snake_case DB rows into the camelCase JSON shapes the frontend
 * already consumes. Keeping this in one place means controllers stay thin and
 * the API contract never drifts.
 */

const mapGuest = (row) => {
  if (!row) return null;
  return {
    guestId: row.guest_id,
    tipTopGoGuestId: row.tip_top_go_guest_id,
    guestTitle: row.guest_title,
    firstName: row.first_name,
    lastName: row.last_name,
    emailAddress: row.email_address,
    phoneNumber: row.phone_number,
    country: row.country,
    gender: row.gender,
    address: row.address,
    sourceType: row.source_type,
    // The frontend compares this to the string "true".
    active: row.active ? "true" : "false",
    createdAt: row.created_at,
  };
};

const mapAmenity = (row) => ({
  amenityId: row.amenity_id,
  amenity: row.amenity,
});

const mapTaxLevy = (row) => ({
  levyId: row.levy_id,
  hotelId: row.hotel_id,
  taxLabel: row.tax_label,
  taxCategory: row.tax_category,
  taxType: row.tax_type,
  flatAmount: row.flat_amount,
  taxPercentage: row.tax_percentage,
  taxApplicable: row.tax_applicable,
});

const mapRoomTypeImage = (row) => ({
  imageId: row.image_id,
  roomTypeId: row.room_type_id,
  roomTypePicture: row.room_type_picture,
});

const mapRoomAmenity = (row) => ({
  amenityId: row.amenity_id,
  roomTypeId: row.room_type_id,
  amenity: row.amenity,
});

const mapRoomType = (row, images = [], amenities = []) => {
  if (!row) return null;
  return {
    roomTypeId: row.room_type_id,
    hotelId: row.hotel_id,
    roomTypeName: row.room_type_name,
    roomCost: row.room_cost,
    discountPrice: row.discount_price,
    totalRooms: row.total_rooms,
    capacity: row.capacity,
    shortDescription: row.short_description,
    isFeatured: Boolean(row.is_featured),
    availableRooms:
      row.available_rooms !== undefined
        ? Number(row.available_rooms)
        : undefined,
    images,
    amenities,
  };
};

const mapHotelImage = (row) => ({
  imageId: row.image_id,
  hotelId: row.hotel_id,
  imageUrl: row.image_url,
  sortOrder: row.sort_order,
});

const mapHotel = (
  row,
  { amenities = [], images = [], roomTypeImages = [], taxLevies = [] } = {}
) => {
  if (!row) return null;
  return {
    hotelId: row.hotel_id,
    hotelName: row.hotel_name,
    propertyType: row.property_type,
    hotelGroupName: row.hotel_group_name,
    sourceType: row.source_type,
    location: row.location,
    stateName: row.state_name,
    lgaName: row.lga_name,
    address: row.address,
    nearestLandmark: row.nearest_landmark,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    hotelDescription: row.hotel_description,
    shortHotelDescription: row.short_hotel_description,
    picture: row.picture,
    hotelMinimumPrice: row.hotel_minimum_price,
    hotelRating: row.hotel_rating,
    totalRatings: row.total_ratings,
    isDisabled: Boolean(row.is_disabled),
    isFeatured: Boolean(row.is_featured),
    amenities,
    images,
    roomTypeImages,
    taxLevies,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapReservation = (row) => {
  if (!row) return null;
  return {
    reservationId: row.reservation_id,
    bookingCode: row.booking_code,
    guestId: row.guest_id,
    hotelId: row.hotel_id,
    hotelName: row.hotel_name,
    payingGuest: {
      guestTitle: row.paying_guest_title,
      firstName: row.paying_guest_first_name,
      lastName: row.paying_guest_last_name,
      email: row.paying_guest_email,
      phoneNumber: row.paying_guest_phone,
      gender: row.paying_guest_gender,
      address: row.paying_guest_address,
    },
    numOfDays: row.num_of_days,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    totalBill: row.total_bill,
    paymentReference: row.payment_reference,
    paymentType: row.payment_type,
    reservationType: row.reservation_type,
    bookingStatus: row.booking_status,
    sourceType: row.source_type,
    referralName: row.referral_name,
    includeBreakfast: row.include_breakfast,
    hasTaxLevies: Boolean(row.has_tax_levies),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rooms: [],
    taxes: [],
    payments: [],
  };
};

const mapReservationRoom = (row) => ({
  id: row.id,
  reservationId: row.reservation_id,
  roomTypeId: row.room_type_id,
  roomTypeName: row.room_type_name,
  roomCost: row.room_cost,
  qty: row.quantity,
  quantity: row.quantity,
  lengthOfStay: row.length_of_stay,
  totalTax: row.total_tax,
  totalCost: row.total_cost,
});

const mapReservationTax = (row) => ({
  id: row.id,
  reservationId: row.reservation_id,
  taxLabel: row.tax_label,
  amount: row.amount,
  percentageOrFlatAmount: row.percentage_or_flat_amount,
  type: row.type,
});

const mapPayment = (row) => ({
  paymentId: row.payment_id,
  reservationId: row.reservation_id,
  paymentType: row.payment_type,
  amount: row.amount,
  bankName: row.bank_name,
  transactionId: row.transaction_id,
  managerName: row.manager_name,
  referenceNumber: row.reference_number,
  creditId: row.credit_id,
  createdAt: row.created_at,
});

const mapSubscriber = (row) => ({
  subscriberId: row.subscriber_id,
  emailAddress: row.email_address,
  createdAt: row.created_at,
});

const mapState = (row) => ({
  stateId: row.state_id,
  stateName: row.state_name,
});

const mapLga = (row) => ({
  lgaId: row.lga_id,
  lgaName: row.lga_name,
  stateId: row.state_id,
});

const mapListingRequest = (row) => {
  let images = [];
  if (row.images) {
    try {
      const parsed = JSON.parse(row.images);
      if (Array.isArray(parsed)) images = parsed;
    } catch (err) {
      images = [];
    }
  }

  return {
    listingId: row.listing_id,
    requestId: row.listing_id,
    propertyName: row.property_name,
    propertyType: row.property_type,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    stateName: row.state_name,
    lgaName: row.lga_name,
    nearestLandmark: row.nearest_landmark,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    rooms: row.rooms,
    message: row.message,
    termsAccepted: Boolean(row.terms_accepted),
    termsAcceptedAt: row.terms_accepted_at,
    images,
    status: row.status,
    hotelId: row.hotel_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

module.exports = {
  mapGuest,
  mapAmenity,
  mapTaxLevy,
  mapRoomTypeImage,
  mapRoomAmenity,
  mapRoomType,
  mapHotel,
  mapHotelImage,
  mapReservation,
  mapReservationRoom,
  mapReservationTax,
  mapPayment,
  mapSubscriber,
  mapState,
  mapLga,
  mapListingRequest,
};
