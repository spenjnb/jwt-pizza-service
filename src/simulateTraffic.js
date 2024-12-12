const fetch = require("node-fetch");

// Configuration
const BASE_URL = "http://localhost:3001/api/v1";
const AUTH_URL = `${BASE_URL}/auth`;
const ORDER_URL = `${BASE_URL}/order/menu`;
const CREATE_ORDER_URL = `${BASE_URL}/order`;
const FRANCHISE_URL = `${BASE_URL}/franchise`;

const users = [
  { name: "User1", email: "user1@example.com", password: "password1" },
  { name: "User2", email: "user2@example.com", password: "password2" },
  { name: "Admin", email: "a@jwt.com", password: "admin" }, // Use default admin
];

let tokens = [];

// Register a new user
const registerUser = async (user) => {
  try {
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (response.ok) {
      console.log(`Registered user: ${user.email}`);
    } else if (response.status === 409) {
      console.log(`User already registered: ${user.email}`);
    } else {
      console.log(`Failed to register user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error registering user:", error);
  }
};

// Login a user
const loginUser = async (user, isAdmin = false) => {
  try {
    const response = await fetch(AUTH_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    if (response.ok) {
      const data = await response.json();
      tokens.push({ token: data.token, email: user.email, isAdmin });
      console.log(`Logged in user: ${user.email}`);
    } else {
      console.log(`Failed login attempt for: ${user.email}`);
    }
  } catch (error) {
    console.error("Error logging in:", error);
  }
};

// Fetch the pizza menu
const getMenu = async () => {
  try {
    const response = await fetch(ORDER_URL);
    if (response.ok) {
      const menu = await response.json();
      if (menu.length === 0) {
        console.log("Menu is empty");
      } else {
        console.log("Menu fetched successfully");
      }
    } else {
      console.log("Failed to fetch menu");
    }
  } catch (error) {
    console.error("Error fetching menu:", error);
  }
};

// Create a valid order
const createOrder = async (token, userEmail) => {
  try {
    const response = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        franchiseId: 1,
        storeId: 1,
        items: [
          { menuId: 1, description: "Veggie", price: 0.05 },
          { menuId: 2, description: "Pepperoni", price: 0.07 },
        ],
      }),
    });
    if (response.ok) {
      console.log(`Created order for user: ${userEmail}`);
    } else {
      console.log(`Failed to create order for user: ${userEmail}`);
    }
  } catch (error) {
    console.error("Error creating order:", error);
  }
};

// Create an invalid order to trigger failure
const createInvalidOrder = async (token, userEmail) => {
  try {
    const response = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        franchiseId: 999, // Invalid ID
        storeId: 999, // Invalid ID
        items: [{ menuId: 999, description: "Invalid Pizza", price: 999.99 }],
      }),
    });
    if (response.ok) {
      console.log(`Unexpected success creating invalid order for ${userEmail}`);
    } else {
      console.log(`Expected failure creating invalid order for ${userEmail}`);
    }
  } catch (error) {
    console.error("Error creating invalid order:", error);
  }
};

// Admin adds a menu item
const addMenuItem = async (adminToken) => {
  try {
    const response = await fetch(`${ORDER_URL}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Student",
        description: "No topping, no sauce, just carbs",
        image: "pizza9.png",
        price: 0.0001,
      }),
    });
    if (response.ok) {
      console.log("Admin added a menu item successfully");
    } else {
      console.log("Failed to add menu item as admin");
    }
  } catch (error) {
    console.error("Error adding menu item:", error);
  }
};

// Admin deletes a franchise
const deleteFranchise = async (adminToken) => {
  try {
    const response = await fetch(`${FRANCHISE_URL}/1`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (response.ok) {
      console.log("Admin deleted a franchise successfully");
    } else {
      console.log("Failed to delete franchise as admin");
    }
  } catch (error) {
    console.error("Error deleting franchise:", error);
  }
};

// Simulate unhandled exception
const simulateException = async () => {
  try {
    // Intentionally cause an error
    throw new Error("Simulated unhandled exception");
  } catch (error) {
    console.error("Simulated exception:", error.message);
  }
};

// Perform all simulations
const performSimulations = async () => {
  try {
    // Register all users
    for (const user of users) {
      await registerUser(user);
    }

    // Login all users
    for (const user of users) {
      const isAdmin = user.email === "a@jwt.com";
      await loginUser(user, isAdmin);
    }

    // Fetch menu
    await getMenu();

    // Create orders for non-admin users
    for (const user of tokens) {
      if (!user.isAdmin) {
        await createOrder(user.token, user.email);
        await createInvalidOrder(user.token, user.email);
      }
    }

    // Admin adds a menu item
    const admin = tokens.find((u) => u.isAdmin);
    if (admin) {
      await addMenuItem(admin.token);
      await deleteFranchise(admin.token);
    }

    // Simulate an unhandled exception
    await simulateException();
  } catch (error) {
    console.error("Error during simulations:", error);
  }
};

// Run simulations periodically
setInterval(performSimulations, 15000); // Every 15 seconds

// Initial run
performSimulations();
