const path = require("path");
const { indexOf } = require("../data/orders-data");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign IDs when necessary
const nextId = require("../utils/nextId");

// <<------- VALIDATION ------->>
function orderExists(request, response, next) {
  const { orderId } = request.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    response.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id ${orderId} does not exist`,
  });
}

function orderRequiresDeliverTo(request, response, next) {
  const {
    data: { deliverTo },
  } = request.body;

  if (!deliverTo || deliverTo === "") {
    next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }

  response.locals.deliverTo = deliverTo;
  next();
}

function orderRequiresMobileNumber(request, response, next) {
  const {
    data: { mobileNumber },
  } = request.body;

  if (!mobileNumber || mobileNumber === "") {
    next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }

  response.locals.mobileNumber = mobileNumber;
  next();
}

function orderRequiresDish(request, response, next) {
  const {
    data: { dishes },
  } = request.body;

  if (!dishes) {
    next({
      status: 400,
      message: "Order must include a dish",
    });
  }

  response.locals.dishes = dishes;
  next();
}

function dishesMustBeNonEmptyArray(request, response, next) {
  dishes = response.locals.dishes;

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }

  next();
}

function eachDishMustHaveQuantityAboveZero(request, response, next) {
  dishes = response.locals.dishes;

  for (let i = 0; i < dishes.length; i++) {
    if (
      !dishes[i].quantity ||
      !(dishes[i].quantity > 0) ||
      !Number.isInteger(dishes[i].quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

function orderIdAbsentOrMatches(request, response, next) {
  const {
    data: { id },
  } = request.body;

  const orderId = request.params.orderId;

  if (!id || orderId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

function statusMustExistAndBeValid(request, response, next) {
  const {
    data: { status },
  } = request.body;

  if (
    status &&
    (status === "pending" ||
      status === "preparing" ||
      status === "out-for-delivery" ||
      status === "delivered")
  ) {
    response.locals.status = status;
    next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function orderStatusIsPending(request, response, next) {
  const { order } = response.locals;
  if (order.status === "pending") {
    next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}
// <<-------   ROUTES   ------->>

// CREATE
// POST /orders
function create(request, response, next) {
  const { deliverTo, mobileNumber, dishes } = response.locals;
  // set default status of new orders as "pending", unless otherwise specified
  const { status = "pending" } = request.body;
  const id = nextId();
  const newOrder = {
    id,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  response.status(201).json({ data: newOrder });
}
// READ
// GET /orders/:orderId
function read(request, response, next) {
  response.json({ data: response.locals.order });
}
// UPDATE
// PUT /orders/:orderId
function update(request, response, next) {
  const order = response.locals.order;
  const {
    data: { id, deliverTo, mobileNumber, status, dishes } = {},
  } = request.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  response.json({ data: order });
}
// DELETE
// DELETE /orders/:orderId
function destroy(request, response, next) {
  const { orderId } = request.params;
  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  response.sendStatus(204);
}
// LIST
// GET /orders
function list(request, response, next) {
  response.json({ data: orders });
}

module.exports = {
  create: [
    orderRequiresDeliverTo,
    orderRequiresMobileNumber,
    orderRequiresDish,
    dishesMustBeNonEmptyArray,
    eachDishMustHaveQuantityAboveZero,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    statusMustExistAndBeValid,
    orderIdAbsentOrMatches,
    orderRequiresDeliverTo,
    orderRequiresMobileNumber,
    orderRequiresDish,
    dishesMustBeNonEmptyArray,
    eachDishMustHaveQuantityAboveZero,
    update,
  ],
  delete: [orderExists, orderStatusIsPending, destroy],
  list,
};