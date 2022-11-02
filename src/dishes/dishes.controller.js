const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign IDs when necessary
const nextId = require("../utils/nextId");

// <<------- VALIDATION ------->>
function dishExists(request, response, next) {
  const dishId = request.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    response.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function dishIdAbsentOrMatches(request, response, next) {
  const {
    data: { id },
  } = request.body;

  const dishId = request.params.dishId;

  if (!id || dishId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

function dishHasName(request, response, next) {
  const {
    data: { name },
  } = request.body;

  if (!name || name === "") {
    next({
      status: 400,
      message: "Dish must include a name",
    });
  }

  response.locals.name = name;
  next();
}

function dishHasDescription(request, response, next) {
  const {
    data: { description },
  } = request.body;

  if (!description || description === "") {
    next({
      status: 400,
      message: "Dish must include a description",
    });
  }

  response.locals.description = description;
  next();
}

function dishHasPrice(request, response, next) {
  const {
    data: { price },
  } = request.body;

  if (!price) {
    next({
      status: 400,
      message: "Dish must include a price",
    });
  }

  response.locals.price = price;
  next();
}

function priceIsPositiveInteger(request, response, next) {
  const price = response.locals.price;
  if (price <= 0 || !Number.isInteger(price)) {
    next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}

function dishHasImageUrl(request, response, next) {
  const {
    data: { image_url },
  } = request.body;

  if (!image_url || image_url === "") {
    next({
      status: 400,
      message: "Dish must include a image_url",
    });
  }

  response.locals.image_url = image_url;
  next();
}

// <<-------   ROUTES   ------->>

// CREATE
// POST /dishes
function create(request, response, next) {
  const {
    data: { name, description, price, image_url },
  } = request.body;
  const id = nextId();
  const newDish = {
    id,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  response.status(201).json({ data: newDish });
}

// READ
// GET /dishes/:dishId
function read(request, response, next) {
  response.json({ data: response.locals.dish });
}
// UPDATE
// PUT /dishes/:dishId
function update(request, response, next) {
  const dish = response.locals.dish;
  const { name, description, price, image_url } = response.locals;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  response.json({ data: dish });
}
// LIST
// GET /dishes

function list(request, response, next) {
  response.json({ data: dishes });
}

module.exports = {
  create: [
    dishHasName,
    dishHasDescription,
    dishHasPrice,
    priceIsPositiveInteger,
    dishHasImageUrl,
    create,
  ],
  update: [
    dishExists,
    dishIdAbsentOrMatches,
    dishHasName,
    dishHasDescription,
    dishHasPrice,
    priceIsPositiveInteger,
    dishHasImageUrl,
    update,
  ],
  read: [dishExists, read],
  list,
};