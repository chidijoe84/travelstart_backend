/**
 * End-to-end smoke test for every endpoint.
 * Boots the Express app on an ephemeral port and drives it with fetch,
 * so no separately running server is required.
 *
 * Usage: node scripts/smokeTest.js
 */
require("dotenv").config();
const app = require("../app");
const { pool } = require("../config/db");

let passed = 0;
let failed = 0;
const failures = [];

const check = (name, condition, extra = "") => {
  if (condition) {
    passed += 1;
    console.log(`  \u2713 ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  \u2717 ${name} ${extra}`);
  }
};

const run = async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;

  const api = async (method, path, body, token) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch (err) {
      json = null;
    }
    return { status: res.status, json };
  };

  const stamp = Date.now();
  const email = `smoke_${stamp}@example.com`;
  let tipTopGoGuestId;
  let reservationId;
  let subscriberId;

  console.log("\n== Health ==");
  {
    const r = await api("GET", "/health");
    check("GET /health returns 200", r.status === 200, `got ${r.status}`);
    check("health reports database up", r.json?.database === "up");
  }

  console.log("\n== Hotels (public) ==");
  {
    const r = await api("GET", "/registrations/hotels?sourceType=showInCompanySite&hotelGroupName=Residency");
    check("GET /registrations/hotels returns 200", r.status === 200, `got ${r.status}`);
    check("returns 8 hotels", Array.isArray(r.json) && r.json.length === 8, `got ${r.json?.length}`);
    const hotel = r.json?.find((h) => h.hotelId === "2");
    check("hotel has amenities", Array.isArray(hotel?.amenities) && hotel.amenities.length > 0);
    check("hotel has taxLevies", Array.isArray(hotel?.taxLevies) && hotel.taxLevies.length > 0);
    check("hotel has roomTypeImages", Array.isArray(hotel?.roomTypeImages) && hotel.roomTypeImages.length > 0);
    check("hotel has camelCase name", typeof hotel?.hotelName === "string");
  }
  {
    const r = await api("GET", "/registrations/hotels?genFilter=Guzape");
    check("genFilter narrows results", r.status === 200 && r.json.length >= 1 && r.json.every((h) => /guzape/i.test(h.hotelName)));
  }

  console.log("\n== States / LGAs (public) ==");
  {
    const r = await api("GET", "/registrations/states");
    check("GET /registrations/states returns 200", r.status === 200, `got ${r.status}`);
    check("returns 37 states", Array.isArray(r.json) && r.json.length === 37, `got ${r.json?.length}`);
    check("state has camelCase name", typeof r.json?.[0]?.stateName === "string");

    const lagos = r.json?.find((s) => s.stateName === "Lagos");
    const lgas = await api("GET", `/registrations/lgas?stateId=${lagos?.stateId}`);
    check("GET /registrations/lgas returns 200", lgas.status === 200, `got ${lgas.status}`);
    check("returns LGAs for Lagos", Array.isArray(lgas.json) && lgas.json.length > 0, `got ${lgas.json?.length}`);
    check("LGAs belong to selected state", lgas.json?.every((l) => l.stateId === lagos?.stateId));
  }

  console.log("\n== Room availability (public) ==");
  {
    const r = await api("GET", "/hotels/2/roomAvailabilitySummary?startDate=2026-11-01%2015:00:00&endDate=2026-11-03%2013:00:00&sourceType=showInCompanySite");
    check("returns 200", r.status === 200, `got ${r.status}`);
    check("returns room types", Array.isArray(r.json) && r.json.length >= 1);
    check("room has availableRooms number", typeof r.json?.[0]?.availableRooms === "number");
  }
  {
    const r = await api("GET", "/hotels/does-not-exist/roomAvailabilitySummary");
    check("unknown hotel returns 404", r.status === 404, `got ${r.status}`);
  }

  console.log("\n== Auth (guest) ==");
  {
    const r = await api("POST", "/registrations/createUser", {
      firstName: "Smoke",
      lastName: "Tester",
      emailAddress: email,
      phoneNumber: "08012345678",
      password: "secret123",
      country: "Nigeria",
      gender: "Male",
      guestTitle: "Mr",
      sourceType: "ResidencyWeb",
      address: "1 Test Street",
    });
    check("createUser returns 201", r.status === 201, `got ${r.status}`);
    check("createUser message matches frontend", r.json?.message === "Registrated Successfully");
    tipTopGoGuestId = r.json?.guestDetails?.tipTopGoGuestId;
    check("createUser returns tipTopGoGuestId", Boolean(tipTopGoGuestId));
    check("createUser hides password", r.json?.guestDetails?.password === undefined);
  }
  {
    const r = await api("POST", "/registrations/createUser", { firstName: "x" });
    check("createUser validation returns 422", r.status === 422, `got ${r.status}`);
  }
  {
    const r = await api("POST", "/registrations/createUser", {
      firstName: "Smoke",
      lastName: "Tester",
      emailAddress: email,
      phoneNumber: "08012345678",
      password: "secret123",
      country: "Nigeria",
      gender: "Male",
      guestTitle: "Mr",
      address: "1 Test Street",
    });
    check("duplicate email returns 409", r.status === 409, `got ${r.status}`);
  }
  {
    const r = await api("POST", "/registrations/accessApp", { emailAddress: email, password: "secret123" });
    check("login returns 200", r.status === 200, `got ${r.status}`);
    check("login success true", r.json?.success === true);
    check("active is string 'true'", r.json?.guestDetails?.active === "true");
  }
  {
    const r = await api("POST", "/registrations/accessApp", { emailAddress: email, password: "wrong" });
    check("wrong password -> success false", r.status === 200 && r.json?.success === false);
  }
  {
    const r = await api("POST", "/registrations/accessApp", { emailAddress: "nobody@example.com", password: "x" });
    check("unknown user message", r.json?.message === "user does not exist");
  }

  console.log("\n== Subscribers (public) ==");
  {
    const subEmail = `sub_${stamp}@example.com`;
    const r = await api("POST", "/registrations/createSubscribers", { emailAddress: subEmail });
    check("subscribe returns 201", r.status === 201, `got ${r.status}`);
    check("subscribe message matches frontend", r.json?.message === "subscription created successfully");
    subscriberId = r.json?.subscriber?.subscriberId;
  }
  {
    const r = await api("POST", "/registrations/createSubscribers", { emailAddress: "not-an-email" });
    check("subscribe validation 422", r.status === 422, `got ${r.status}`);
  }

  console.log("\n== Favourites (public) ==");
  {
    const like = await api("POST", "/registrations/addFavoriteHotel", {
      hotelId: "2",
      tipTopGoGuestId,
      type: "like",
      sourceType: "ResidencyWeb",
    });
    check("add favourite returns 201", like.status === 201, `got ${like.status}`);

    const list = await api("GET", `/registrations/getGuestFavoriteHotels/${tipTopGoGuestId}`);
    check("favourites returns array", Array.isArray(list.json));
    check("favourite contains hotel 2", list.json?.some((h) => h.hotelId === "2"));

    const unlike = await api("POST", "/registrations/addFavoriteHotel", {
      hotelId: "2",
      tipTopGoGuestId,
      type: "unlike",
    });
    check("remove favourite returns 200", unlike.status === 200, `got ${unlike.status}`);
  }

  console.log("\n== Reservations (public) ==");
  {
    const r = await api("POST", "/guests/makeWebReservation", {
      payingGuest: { guestTitle: "Mr", firstName: "Smoke", lastName: "Tester", email, phoneNumber: "08012345678", gender: "Male", address: "1 Test Street" },
      paymentReference: `ref_${stamp}`,
      totalBill: 120000,
      paymentType: "paystack",
      reservationType: "booked",
      hotelName: "Residency Hotel Guzape Abuja",
      hotelId: "2",
      numOfDays: 2,
      checkInDate: "2026-11-01 15:00:00",
      checkOutDate: "2026-11-03 13:00:00",
      bookingStatus: "unprocessed",
      sourceType: "companySite",
      hasTaxLevies: true,
      bookings: [
        {
          roomTypeId: "2-EXEC-LUX",
          roomTypeName: "Residency Executive Luxury",
          roomCost: 57000,
          qty: 1,
          quantity: 1,
          lengthOfStay: 2,
          totalCost: 57000,
          totalTaxRoomCat: 3275,
          taxDetails: [
            { taxLabel: "VAT", taxAmount: 4275, taxPercentage: 7.5, flatAmount: null },
            { taxLabel: "Consumption Tax", taxAmount: 1000, taxPercentage: null, flatAmount: 1000 },
          ],
        },
      ],
      paymentDetails: [{ paymentType: "cash", amount: 120000, bankName: "Select a Bank" }],
    });
    check("makeWebReservation returns 201", r.status === 201, `got ${r.status}`);
    check("returns bookingCode", typeof r.json?.bookingCode === "string" && r.json.bookingCode.length > 0);
    reservationId = r.json?.reservationId;
  }
  {
    const r = await api("POST", "/guests/makeWebReservation", { hotelId: "2" });
    check("reservation validation 422", r.status === 422, `got ${r.status}`);
  }

  console.log("\n== Admin auth ==");
  let token;
  {
    const bad = await api("GET", "/admin/hotels");
    check("protected route without token 401", bad.status === 401, `got ${bad.status}`);

    const r = await api("POST", "/admin/auth/login", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    check("admin login returns 200", r.status === 200, `got ${r.status}`);
    token = r.json?.token;
    check("admin login returns token", Boolean(token));
  }
  {
    const r = await api("GET", "/admin/auth/me", null, token);
    check("admin me returns 200", r.status === 200, `got ${r.status}`);
    check("admin me email", r.json?.admin?.email === process.env.ADMIN_EMAIL);
  }

  console.log("\n== Admin hotels CRUD ==");
  const tempHotelId = `SMOKE-${stamp}`;
  {
    const c = await api("POST", "/admin/hotels", {
      hotelId: tempHotelId,
      hotelName: "Smoke Test Hotel",
      location: "Test",
      stateName: "Lagos",
      lgaName: "Eti-Osa",
      address: "Test Address",
      hotelMinimumPrice: 10000,
      amenities: ["Free WiFi", "Parking"],
    }, token);
    check("create hotel 201", c.status === 201, `got ${c.status}`);
    check("created hotel has amenities", c.json?.hotel?.amenities?.length === 2);
    check("created hotel keeps state", c.json?.hotel?.stateName === "Lagos");
    check("created hotel keeps LGA", c.json?.hotel?.lgaName === "Eti-Osa");

    const u = await api("PUT", `/admin/hotels/${tempHotelId}`, { hotelName: "Smoke Test Hotel Updated" }, token);
    check("update hotel 200", u.status === 200, `got ${u.status}`);
    check("hotel name updated", u.json?.hotel?.hotelName === "Smoke Test Hotel Updated");

    const g = await api("GET", `/admin/hotels/${tempHotelId}`, null, token);
    check("get hotel 200", g.status === 200);

    const list = await api("GET", "/admin/hotels", null, token);
    check("admin list hotels", list.status === 200 && Array.isArray(list.json?.hotels));

    const d = await api("DELETE", `/admin/hotels/${tempHotelId}`, null, token);
    check("delete hotel 200", d.status === 200, `got ${d.status}`);
  }

  console.log("\n== Admin room-types CRUD ==");
  const tempRoomId = `SMOKE-RT-${stamp}`;
  {
    const c = await api("POST", "/admin/room-types", {
      roomTypeId: tempRoomId,
      hotelId: "2",
      roomTypeName: "Smoke Room",
      roomCost: 20000,
      totalRooms: 3,
      images: ["https://placehold.co/600x400?text=Smoke+Room"],
    }, token);
    check("create room type 201", c.status === 201, `got ${c.status}`);
    check("room type has image", c.json?.roomType?.images?.length === 1);

    const list = await api("GET", "/admin/room-types?hotelId=2", null, token);
    check("list room types 200", list.status === 200 && Array.isArray(list.json?.roomTypes));

    const u = await api("PUT", `/admin/room-types/${tempRoomId}`, { roomCost: 25000 }, token);
    check("update room type 200", u.status === 200, `got ${u.status}`);
    check("room cost updated", u.json?.roomType?.roomCost === 25000);

    const d = await api("DELETE", `/admin/room-types/${tempRoomId}`, null, token);
    check("delete room type 200", d.status === 200, `got ${d.status}`);
  }

  console.log("\n== Admin tax-levies CRUD ==");
  const tempLevyId = `SMOKE-LEV-${stamp}`;
  {
    const c = await api("POST", "/admin/tax-levies", {
      levyId: tempLevyId,
      hotelId: "2",
      taxLabel: "Smoke Tax",
      taxType: "percentage",
      taxPercentage: 5,
      taxApplicable: "fd",
    }, token);
    check("create tax levy 201", c.status === 201, `got ${c.status}`);

    const list = await api("GET", "/admin/tax-levies?hotelId=2", null, token);
    check("list tax levies 200", list.status === 200 && Array.isArray(list.json?.taxLevies));

    const u = await api("PUT", `/admin/tax-levies/${tempLevyId}`, { taxPercentage: 6 }, token);
    check("update tax levy 200", u.status === 200, `got ${u.status}`);

    const d = await api("DELETE", `/admin/tax-levies/${tempLevyId}`, null, token);
    check("delete tax levy 200", d.status === 200, `got ${d.status}`);
  }

  console.log("\n== Admin reservations ==");
  {
    const list = await api("GET", "/admin/reservations", null, token);
    check("list reservations 200", list.status === 200 && Array.isArray(list.json?.reservations));
    check("created reservation listed", list.json?.reservations?.some((x) => x.reservationId === reservationId));

    const one = await api("GET", `/admin/reservations/${reservationId}`, null, token);
    check("get reservation 200", one.status === 200, `got ${one.status}`);
    check("reservation has rooms", one.json?.reservation?.rooms?.length >= 1);
    check("reservation has taxes", one.json?.reservation?.taxes?.length >= 1);
    check("reservation has payments", one.json?.reservation?.payments?.length >= 1);

    const p = await api("PATCH", `/admin/reservations/${reservationId}/status`, { bookingStatus: "confirmed" }, token);
    check("update status 200", p.status === 200, `got ${p.status}`);
  }

  console.log("\n== Admin guests / subscribers / stats ==");
  {
    const g = await api("GET", "/admin/guests", null, token);
    check("list guests 200", g.status === 200 && Array.isArray(g.json?.guests));
    check("created guest listed", g.json?.guests?.some((x) => x.emailAddress === email));

    const s = await api("GET", "/admin/subscribers", null, token);
    check("list subscribers 200", s.status === 200 && Array.isArray(s.json?.subscribers));

    const st = await api("GET", "/admin/stats", null, token);
    check("stats 200", st.status === 200 && typeof st.json?.stats?.hotels === "number");
  }

  console.log("\n== Cleanup + 404 ==");
  {
    if (subscriberId) {
      const d = await api("DELETE", `/admin/subscribers/${subscriberId}`, null, token);
      check("delete subscriber 200", d.status === 200, `got ${d.status}`);
    }
    const del = await api("DELETE", `/admin/reservations/${reservationId}`, null, token);
    check("delete reservation 200", del.status === 200, `got ${del.status}`);

    const nf = await api("GET", "/this/route/does/not/exist");
    check("unknown route returns 404", nf.status === 404, `got ${nf.status}`);
  }

  server.close();
  await pool.end();

  console.log(`\n========================================`);
  console.log(`  PASSED: ${passed}   FAILED: ${failed}`);
  if (failed > 0) {
    console.log(`  Failures: ${failures.join(", ")}`);
  }
  console.log(`========================================`);
  process.exit(failed > 0 ? 1 : 0);
};

run().catch(async (err) => {
  console.error("Smoke test crashed:", err);
  try {
    await pool.end();
  } catch (e) {
    /* ignore */
  }
  process.exit(1);
});
