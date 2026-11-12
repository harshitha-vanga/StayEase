
// STAYEASE - HOTEL DATA
const hotels = [
    {
        id: 1,
        name: "Beach Paradise Resort",
        location: "Goa",
        price: 3500,
        guests: 2,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
        description: "Beautiful beach view with swimming pool and luxury rooms."
    },
    {
        id: 2,
        name: "Ocean Pearl Resort",
        location: "Goa",
        price: 3500,
        guests: 4,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
        description: "Premium resort with comfortable rooms and elegant interiors."
    },
    {
        id: 3,
        name: "Mountain ViewStay",
        location: "Manali",
        price: 2799.80,
        guests: 3,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800",
        description: "Enjoy peaceful mountain views and comfortable rooms."
    },
    {
        id: 4,
        name: "Royal Palace Hotel",
        location: "Jaipur",
        price: 2200,
        guests: 4,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        description: "Experience royal hospitality and premium facilities."
    },
    {
        id: 5,
        name: "City Comfort Inn",
        location: "Delhi",
        price: 1800,
        guests: 4,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
        description: "Modern rooms in a convenient city location."
    },
    {
        id: 6,
        name: "Green Valley Resort",
        location: "Ooty",
        price: 3000,
        guests: 4,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800",
        description: "Relax in nature surrounded by beautiful green hills."
    },
    {
        id: 7,
        name: "Sea Breeze Hotel",
        location: "Mumbai",
        price: 4000,
        guests: 4,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
        description: "Premium accommodation with elegant interiors."
    }
];

const roomContainer = document.getElementById("roomContainer");
const searchForm = document.getElementById("searchForm");

let searchDetails = {
    destination: "",
    checkin: "",
    checkout: "",
    guests: 2
};

let pendingBooking = null;


// CSRF TOKEN
function getCSRFToken() {
    const cookie = document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="));

    if (cookie) {
        return cookie.split("=")[1];
    }

    const csrfInput = document.querySelector(
        '[name="csrfmiddlewaretoken"]'
    );

    return csrfInput ? csrfInput.value : "";
}


// PAYMENT SCREEN STYLES
const paymentStyles = document.createElement("style");

paymentStyles.textContent = `
    .payment-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.65);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 15px;
    }

    .payment-box {
        background: white;
        width: 100%;
        max-width: 420px;
        padding: 25px;
        border-radius: 15px;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    }

    .payment-box h2 {
        color: #183b63;
        text-align: center;
    }

    .payment-box p {
        color: #555;
    }

    .payment-box input,
    .payment-box select {
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 6px;
    }

    .payment-option {
        margin: 15px 0;
    }

    .payment-option label {
        display: block;
        margin: 12px 0;
    }

    .pay-now-button {
        width: 100%;
        background: #1769aa;
        color: white;
        padding: 13px;
        border: none;
        border-radius: 7px;
        cursor: pointer;
        font-weight: bold;
        margin-top: 12px;
    }

    .payment-cancel-button {
        width: 100%;
        background: #eee;
        color: #333;
        padding: 12px;
        border: none;
        border-radius: 7px;
        cursor: pointer;
        margin-top: 8px;
    }

    .payment-note {
        font-size: 12px;
        text-align: center;
        color: #777;
    }
`;

document.head.appendChild(paymentStyles);


// DISPLAY HOTELS
function displayHotels(list) {
    roomContainer.innerHTML = "";

    if (list.length === 0) {
        roomContainer.innerHTML = `
            <p class="no-results">
                No hotels found. Try another destination.
            </p>
        `;
        return;
    }

    list.forEach(hotel => {
        const card = document.createElement("div");
        card.className = "room-card";

        card.innerHTML = `
            <img src="${hotel.image}"
                 alt="${hotel.name}"
                 class="room-image">

            <div class="room-info">
                <h3>${hotel.name}</h3>
                <p>Location: ${hotel.location}</p>
                <p>${hotel.description}</p>
                <p>Rating: ${hotel.rating}</p>
                <p>Maximum guests: ${hotel.guests}</p>

                <div class="room-price">
                    ₹${hotel.price.toLocaleString("en-IN")}
                    <small>/ night</small>
                </div>

                <button class="book-button"
                        data-hotel-id="${hotel.id}">
                    Book Now
                </button>
            </div>
        `;

        roomContainer.appendChild(card);
    });
}


// INITIAL DISPLAY
displayHotels(hotels);


// SEARCH HOTELS
if (searchForm) {
    searchForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const destination = document
            .getElementById("destination").value.trim();

        const checkin = document.getElementById("checkin").value;
        const checkout = document.getElementById("checkout").value;
        const guests = Number(document.getElementById("guests").value);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!checkin || !checkout) {
            alert("Please select check-in and check-out dates.");
            return;
        }

        if (new Date(checkin + "T00:00:00") < today) {
            alert("Check-in date cannot be in the past.");
            return;
        }

        if (checkout <= checkin) {
            alert("Check-out must be after check-in.");
            return;
        }

        if (guests < 1) {
            alert("Please select at least one guest.");
            return;
        }

        searchDetails = {
            destination,
            checkin,
            checkout,
            guests
        };

        const filteredHotels = hotels.filter(hotel => {
            const locationMatch = hotel.location
                .toLowerCase()
                .includes(destination.toLowerCase());

            return locationMatch && hotel.guests >= guests;
        });

        displayHotels(filteredHotels);

        document.getElementById("rooms")?.scrollIntoView({
            behavior: "smooth"
        });
    });
}


// OPEN PAYMENT SCREEN
function openPaymentScreen() {
    const { hotel, customerName, totalPrice } = pendingBooking;

    const overlay = document.createElement("div");
    overlay.className = "payment-overlay";
    overlay.id = "paymentOverlay";

    overlay.innerHTML = `
        <div class="payment-box">

            <h2>StayEase Payment</h2>

            <p><strong>Hotel:</strong> ${hotel.name}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Amount:</strong> ₹${totalPrice.toFixed(2)}</p>

            <hr>

            <div class="payment-option">
                <strong>Select Payment Method</strong>

                <label>
                    <input type="radio" name="paymentMethod"
                           value="UPI" checked>
                    UPI
                </label>

                <label>
                    <input type="radio" name="paymentMethod"
                           value="Card">
                    Debit / Credit Card
                </label>
            </div>

            <div id="upiFields">
                <input type="text"
                       id="upiId"
                       placeholder="Demo UPI ID (example@upi)">
            </div>

            <div id="cardFields" style="display:none;">
                <input type="text"
                       placeholder="Demo card number (not real)"
                       disabled>

                <p class="payment-note">
                    Card payment is simulated. Do not enter real card details.
                </p>
            </div>

            <button class="pay-now-button" id="simulateSuccess">
                Simulate Successful Payment
            </button>

            <button class="payment-cancel-button" id="simulateFailure">
                Simulate Payment Failure
            </button>

            <button class="payment-cancel-button" id="closePayment">
                Cancel
            </button>

            <p class="payment-note">
                Demo payment only. No real money is charged.
            </p>

        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll(
        'input[name="paymentMethod"]'
    ).forEach(input => {
        input.addEventListener("change", function() {
            document.getElementById("upiFields").style.display =
                this.value === "UPI" ? "block" : "none";

            document.getElementById("cardFields").style.display =
                this.value === "Card" ? "block" : "none";
        });
    });

    document.getElementById("simulateSuccess").onclick = async function() {
        const method = document.querySelector(
            'input[name="paymentMethod"]:checked'
        ).value;

        if (method === "UPI") {
            const upiId = document.getElementById("upiId").value.trim();

            if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId)) {
                alert("Enter a valid demo UPI ID, for example test@upi.");
                return;
            }
        }

        const successButton = this;
        successButton.disabled = true;
        successButton.textContent = "Processing...";

        await saveBookingAfterPayment(method, overlay);
    };

    document.getElementById("simulateFailure").onclick = function() {
        alert("Demo payment failed! Your booking has not been created.");
        overlay.remove();
        pendingBooking = null;
    };

    document.getElementById("closePayment").onclick = function() {
        overlay.remove();
        pendingBooking = null;
    };
}


// SAVE BOOKING AFTER DEMO PAYMENT
async function saveBookingAfterPayment(paymentMethod, overlay) {
    const {
        hotel,
        customerName,
        customerPhone,
        button
    } = pendingBooking;

    const formData = new FormData();

    formData.append("hotel_id", hotel.id);
    formData.append("customer_name", customerName);
    formData.append("phone", customerPhone);
    formData.append("check_in", searchDetails.checkin);
    formData.append("check_out", searchDetails.checkout);
    formData.append("guests", searchDetails.guests);

    button.disabled = true;
    button.textContent = "Confirming...";

    try {
        const response = await fetch("/book/", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken()
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Booking failed.");
        }

        if (!result.booking_id) {
            throw new Error("Booking ID was not received.");
        }

        alert(
            "PAYMENT SUCCESSFUL!\n\n" +
            "Payment Method: " + paymentMethod + "\n" +
            "Booking ID: " + result.booking_id + "\n" +
            "Hotel: " + hotel.name + "\n" +
            "Customer: " + customerName + "\n" +
            "Amount: ₹" + result.total_price +
            "\n\nOpening your booking confirmation..."
        );

        window.location.href =
            result.confirmation_url ||
            `/booking-confirmation/${result.booking_id}/`;

    } catch (error) {
        alert(
            "Booking could not be completed: " +
            error.message +
            "\n\nNo booking was created."
        );

        overlay.remove();
        pendingBooking = null;

        button.disabled = false;
        button.textContent = "Book Now";
    }
}


// BOOK HOTEL
if (roomContainer) {
    roomContainer.addEventListener("click", function(event) {
        const button = event.target.closest(".book-button");

        if (!button) return;

        const hotelId = Number(button.dataset.hotelId);
        const hotel = hotels.find(item => item.id === hotelId);

        if (!hotel) {
            alert("Hotel not found.");
            return;
        }

        if (!searchDetails.checkin || !searchDetails.checkout) {
            alert("Please search for a hotel and select dates first.");

            document.querySelector(".booking-section")?.scrollIntoView({
                behavior: "smooth"
            });

            return;
        }

        if (searchDetails.guests > hotel.guests) {
            alert("This hotel cannot accommodate that many guests.");
            return;
        }

        const customerName = prompt("Enter your full name:");

        if (!customerName || !customerName.trim()) {
            alert("Please enter your name.");
            return;
        }

        const customerPhone = prompt("Enter your 10-digit phone number:");

        if (!customerPhone || !/^[0-9]{10}$/.test(customerPhone.trim())) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        const nights = (
            new Date(searchDetails.checkout + "T00:00:00") -
            new Date(searchDetails.checkin + "T00:00:00")
        ) / (1000 * 60 * 60 * 24);

        const totalPrice = hotel.price * nights;

        pendingBooking = {
            hotel,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            totalPrice,
            button
        };

        openPaymentScreen();
    });
}


// SET MINIMUM DATE
const checkinInput = document.getElementById("checkin");
const checkoutInput = document.getElementById("checkout");

const todayString = new Date().toLocaleDateString("en-CA");

if (checkinInput && checkoutInput) {
    checkinInput.min = todayString;
    checkoutInput.min = todayString;

    checkinInput.addEventListener("change", function() {
        checkoutInput.min = this.value;

        if (checkoutInput.value && checkoutInput.value <= this.value) {
            checkoutInput.value = "";
        }
    });
}

console.log("StayEase with Booking Confirmation System loaded successfully!");
